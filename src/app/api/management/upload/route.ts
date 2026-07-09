import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { getNextTrackId, addTrack, getCatalog } from "@/lib/catalog";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

// Extensiones de audio aceptadas. La extensión viene del nombre del archivo
// subido (no confiable): nunca se interpola en un shell y solo se usa si está
// en esta lista.
const ALLOWED_EXTENSIONS = new Set([".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg"]);

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "") // quitar extensión
    .replace(/[_-]+/g, " ")  // guiones/underscores → espacios
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase()); // capitalizar primera letra
}

function getDuration(filePath: string): number {
  try {
    // execFileSync sin shell: la ruta viaja como argumento, no se interpola.
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
      { encoding: "utf-8" }
    );
    return Math.round(parseFloat(out.trim()) || 0);
  } catch {
    return 0;
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const albumId = formData.get("albumId") as string | null;

  if (!file || !albumId) {
    return NextResponse.json({ error: "file and albumId required" }, { status: 400 });
  }

  // Buscar datos del álbum destino para heredar cover/gradient
  const catalog = await getCatalog();
  const album = catalog.find((a) => a.id === albumId);
  if (!album) {
    return NextResponse.json({ error: "album not found" }, { status: 404 });
  }

  // Obtener siguiente trackId
  const trackId = await getNextTrackId();

  const root = process.cwd();
  const rawExt = path.extname(file.name).toLowerCase();
  const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : null;
  if (!ext) {
    return NextResponse.json(
      { error: `Formato no soportado. Usa: ${[...ALLOWED_EXTENSIONS].join(", ")}` },
      { status: 400 }
    );
  }
  const masterDir = path.join(root, "media", "masters");
  mkdirSync(masterDir, { recursive: true });
  const masterPath = path.join(masterDir, `${trackId}${ext}`);

  try {
    // Guardar archivo temporalmente
    const arrayBuffer = await file.arrayBuffer();
    writeFileSync(masterPath, Buffer.from(arrayBuffer));

    // Obtener duración con ffprobe
    const duration = getDuration(masterPath);

    // Convertir a HLS cifrado con el script existente
    const scriptPath = [root, "scripts", "protect-audio.mjs"].join(path.sep);
    execFileSync("node", [scriptPath, masterPath, String(trackId)], {
      stdio: "pipe",
      cwd: root,
    });

    // Contar tracks existentes en el álbum para sortOrder
    const existingTracks = album.tracks.length;

    // Registrar en Convex
    const title = titleFromFilename(file.name);
    const result = await addTrack({
      trackId,
      albumId,
      title,
      artist: album.artist,
      album: album.title,
      duration,
      coverGradient: album.coverGradient,
      coverArtDesign: album.coverArtDesign as string,
      coverImage: album.coverImage,
      sortOrder: existingTracks,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, trackId, title, duration });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  } finally {
    // Limpiar archivo master temporal
    if (existsSync(masterPath)) {
      rmSync(masterPath, { force: true });
    }
  }
}
