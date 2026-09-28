# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["stable-ts>=2.17", "torch", "requests"]
# ///
"""
Sincroniza automáticamente la letra de las canciones con su pista de voz.

Busca los WAV de voz en media/vocals/ (nombrados con el título de la
canción), alinea la letra guardada en Convex con la voz usando Whisper
(stable-ts) y guarda el resultado en formato LRC en el mismo campo de letra.

Uso:
  npm run align                          # todas las voces sin sincronizar
  npm run align -- "Apagar"              # solo esa canción (título o id)
  npm run align -- --dry-run "Apagar"    # muestra el resultado sin guardar
  npm run align -- --force               # rehace también las ya sincronizadas
  npm run align -- --model large-v3      # modelo más preciso (más lento)
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
VOCALS_DIR = ROOT / "media" / "vocals"
TIMESTAMP_RE = re.compile(r"^\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]\s?")
SECTION_RE = re.compile(r"^\[[^\]]*\]$")
# Una línea que dura menos que esto casi siempre es un fallo de alineación.
MIN_LINE_SECONDS = 0.5


# --- Convex (API HTTP) ------------------------------------------------------

def convex_url() -> str:
    env = (ROOT / ".env.local").read_text(encoding="utf-8")
    match = re.search(r"^NEXT_PUBLIC_CONVEX_URL=(.+)$", env, re.M)
    if not match:
        sys.exit("No se encontró NEXT_PUBLIC_CONVEX_URL en .env.local")
    return match.group(1).strip().strip('"')


def convex_call(kind: str, path: str, args: dict):
    res = requests.post(
        f"{convex_url()}/api/{kind}",
        json={"path": path, "args": args, "format": "json"},
        timeout=60,
    )
    res.raise_for_status()
    body = res.json()
    if body.get("status") != "success":
        raise RuntimeError(body.get("errorMessage", body))
    return body["value"]


# --- Letra ------------------------------------------------------------------

def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", text)


def strip_timestamp(line: str) -> str:
    return TIMESTAMP_RE.sub("", line, count=1)


def is_sung(line: str) -> bool:
    text = line.strip()
    return text != "" and not SECTION_RE.match(text)


def is_synced(lyrics: str) -> bool:
    return any(TIMESTAMP_RE.match(line) for line in lyrics.splitlines())


def format_timestamp(seconds: float) -> str:
    total = max(0.0, seconds)
    minutes = int(total // 60)
    secs = int(total % 60)
    cs = int(round((total - int(total)) * 100)) % 100
    return f"[{minutes:02d}:{secs:02d}.{cs:02d}]"


# --- Alineación -------------------------------------------------------------

_model = None


def load_model(name: str):
    global _model
    if _model is None:
        import stable_whisper

        print(f"Cargando modelo Whisper '{name}' (la primera vez se descarga)...")
        _model = stable_whisper.load_model(name, device="cpu")
    return _model


def align_lines(wav: Path, lines: list[str], model_name: str) -> list[float | None]:
    """Devuelve el segundo de inicio de cada línea cantada."""
    import whisper

    model = load_model(model_name)
    # Se decodifica el WAV entero antes de alinear: si stable-ts lee el audio
    # por streaming, al terminar corta ffmpeg y este llena la salida de
    # errores "Broken pipe" inofensivos.
    audio = whisper.load_audio(str(wav))
    result = model.align(
        audio,
        "\n".join(lines),
        language="es",
        original_split=True,
        verbose=None,
    )

    segments = [s for s in result.segments if s.text.strip()]
    if len(segments) == len(lines):
        return [round(s.start, 2) for s in segments]

    # Si Whisper agrupó distinto, se reparten las palabras por línea contando
    # palabras en orden (la letra alineada es exactamente la nuestra).
    words = result.all_words()
    starts: list[float | None] = []
    cursor = 0
    for line in lines:
        count = len(line.split())
        chunk = words[cursor : cursor + count]
        starts.append(round(chunk[0].start, 2) if chunk else None)
        cursor += count
    return starts


# --- Programa ---------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("songs", nargs="*", help="títulos o ids de canciones (por defecto, todas las voces)")
    parser.add_argument("--dry-run", action="store_true", help="muestra el resultado sin guardar en Convex")
    parser.add_argument("--force", action="store_true", help="rehace también canciones ya sincronizadas")
    parser.add_argument("--model", default="medium", help="modelo Whisper: small, medium, large-v3 (defecto: medium)")
    opts = parser.parse_args()

    if not VOCALS_DIR.is_dir():
        sys.exit(f"No existe la carpeta {VOCALS_DIR.relative_to(ROOT)}")

    catalog = convex_call("query", "catalog:getCatalog", {})
    tracks = [t for album in catalog for t in album["tracks"]]
    for t in tracks:
        t["id"] = int(t["id"])  # la API JSON de Convex devuelve 154.0
    by_title: dict[str, list[dict]] = {}
    for t in tracks:
        by_title.setdefault(normalize(t["title"]), []).append(t)

    wavs = sorted(p for p in VOCALS_DIR.iterdir() if p.suffix.lower() == ".wav")
    wanted = {normalize(s) for s in opts.songs}

    done, skipped, failed, review = [], [], [], []
    for wav in wavs:
        key = normalize(wav.stem)
        matches = by_title.get(key, [])
        if wanted and key not in wanted and not any(str(t["id"]) in opts.songs for t in matches):
            continue

        label = f"{wav.name}"
        if not matches:
            skipped.append(f"{label}: no hay ninguna canción con ese título en el catálogo")
            continue
        if len(matches) > 1:
            ids = ", ".join(str(t["id"]) for t in matches)
            skipped.append(f"{label}: título repetido en varias canciones ({ids}); renombra el archivo")
            continue

        track = matches[0]
        lyrics = track.get("lyrics") or ""
        if not lyrics.strip():
            skipped.append(f"{label}: la canción no tiene letra guardada en el panel")
            continue
        if is_synced(lyrics) and not opts.force:
            skipped.append(f"{label}: ya está sincronizada (usa --force para rehacerla)")
            continue

        raw_lines = [strip_timestamp(l) for l in lyrics.splitlines()]
        sung_idx = [i for i, l in enumerate(raw_lines) if is_sung(l)]
        sung_lines = [raw_lines[i].strip() for i in sung_idx]

        print(f"\n▶ {track['title']} (id {track['id']}) — {len(sung_lines)} líneas")
        try:
            starts = align_lines(wav, sung_lines, opts.model)
        except Exception as exc:  # noqa: BLE001 — se informa y sigue con la siguiente
            failed.append(f"{label}: {exc}")
            print(f"  ✖ Error: {exc}")
            continue

        times = dict(zip(sung_idx, starts))
        # Dudosa: sin tiempo, o pegada a la siguiente (cuando Whisper no
        # encuentra una línea la comprime contra la que sigue).
        doubtful = set()
        for pos, i in enumerate(sung_idx):
            t = starts[pos]
            nxt = starts[pos + 1] if pos + 1 < len(starts) else None
            if t is None or (nxt is not None and nxt - t < MIN_LINE_SECONDS):
                doubtful.add(i)

        out_lines = []
        for i, line in enumerate(raw_lines):
            t = times.get(i)
            out_lines.append(f"{format_timestamp(t)}{line}" if t is not None else line)
            if i in times:
                shown = format_timestamp(t)[1:-1] if t is not None else "--:--.--"
                flag = "  ⚠" if i in doubtful else ""
                print(f"  {shown}  {line.strip()}{flag}")

        if doubtful:
            print(f"  ⚠ {len(doubtful)} líneas dudosas; revísalas en el panel")
            review.append(f"{track['title']}: {len(doubtful)} líneas dudosas")

        if opts.dry_run:
            done.append(f"{track['title']} (sin guardar, --dry-run)")
            continue

        res = convex_call(
            "mutation",
            "catalog:updateTrackDetails",
            {"trackId": track["id"], "lyrics": "\n".join(out_lines)},
        )
        if not res.get("ok"):
            failed.append(f"{label}: {res.get('error')}")
            continue
        done.append(track["title"])
        print("  ✔ Guardada en Convex")

    print("\n— Resumen —")
    print(f"Sincronizadas: {len(done)}")
    for d in done:
        print(f"  ✔ {d}")
    for s in skipped:
        print(f"  – {s}")
    for f in failed:
        print(f"  ✖ {f}")
    if review:
        print("Para revisar en el panel (Revisar sincronización):")
        for r in review:
            print(f"  ⚠ {r}")
    if wanted and not (done or skipped or failed):
        print("  Ningún WAV coincide con lo pedido. Revisa el nombre del archivo en media/vocals/.")


if __name__ == "__main__":
    main()
