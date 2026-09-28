"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Undo2, Loader2, Wand2, Minus, Plus } from "lucide-react";
import { useSecureAudio } from "@/hooks/useSecureAudio";
import {
  activeLineIndex,
  estimateTimings,
  formatTimestamp,
  isSungLine,
  parseLyrics,
  serializeLyrics,
} from "@/lib/lyrics";

const NUDGE_SECONDS = 0.25;

/**
 * Sincronizador de letra. Dos formas de trabajar:
 * - Marcar: reproducir y pulsar Espacio al empezar cada línea.
 * - Revisar: partir de los tiempos automáticos, escuchar, y corregir solo
 *   las líneas que fallen (tocar la línea la reproduce desde ahí; − / +
 *   ajustan su tiempo, Espacio le pone el segundo actual).
 * El resultado se guarda en formato LRC dentro del mismo campo de letra.
 */
export default function LyricsSyncer({
  trackId,
  duration,
  lyrics,
  onChange,
  onDone,
}: {
  trackId: number;
  // duración del catálogo, para estimar antes de que cargue el audio
  duration: number;
  lyrics: string;
  onChange: (lyrics: string) => void;
  onDone: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const audio = useSecureAudio({ onEnded: () => setPlaying(false) });
  const lines = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const sungIndexes = useMemo(
    () => lines.map((l, i) => (isSungLine(l) ? i : -1)).filter((i) => i >= 0),
    [lines]
  );
  // Línea seleccionada: la que recibe la próxima marca o los ajustes − / +.
  const [selected, setSelected] = useState<number | undefined>(() => sungIndexes[0]);
  // Historial para deshacer: letra antes de cada cambio.
  const [history, setHistory] = useState<string[]>([]);
  const lineRefs = useRef<(HTMLLIElement | null)[]>([]);

  const ready = audio.readyTrackId === String(trackId);
  const playingLine = activeLineIndex(lines, audio.time);

  useEffect(() => {
    audio.load(String(trackId));
  }, [trackId]);

  useEffect(() => {
    if (playing && ready) audio.play();
    else audio.pause();
  }, [playing, ready]);

  useEffect(() => {
    if (selected === undefined) return;
    lineRefs.current[selected]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  const commit = useCallback(
    (next: typeof lines) => {
      setHistory((h) => [...h.slice(-49), lyrics]);
      onChange(serializeLyrics(next));
    },
    [lyrics, onChange]
  );

  const setLineTime = useCallback(
    (index: number, time: number | null) => {
      commit(lines.map((l, i) => (i === index ? { ...l, time } : l)));
    },
    [lines, commit]
  );

  // Marca la línea seleccionada con el segundo actual y pasa a la siguiente.
  const mark = useCallback(() => {
    if (selected === undefined || !ready) return;
    setLineTime(selected, Math.round(audio.time * 100) / 100);
    setSelected(sungIndexes.find((i) => i > selected));
    if (!playing) setPlaying(true);
  }, [selected, ready, audio.time, playing, setLineTime, sungIndexes]);

  const nudge = (index: number, delta: number) => {
    const t = lines[index].time;
    if (t === null) return;
    setLineTime(index, Math.max(0, Math.round((t + delta) * 100) / 100));
  };

  // Tocar una línea la selecciona y la reproduce desde un poco antes.
  const selectLine = (index: number) => {
    setSelected(index);
    const t = lines[index].time;
    if (t !== null && ready) {
      audio.seek(Math.max(0, t - 1.5));
      setPlaying(true);
    }
  };

  const undo = useCallback(() => {
    const prev = history[history.length - 1];
    if (prev === undefined) return;
    setHistory((h) => h.slice(0, -1));
    onChange(prev);
  }, [history, onChange]);

  const autoFill = () => {
    const total = audio.duration > 0 ? audio.duration : duration;
    commit(estimateTimings(lines.map((l) => ({ ...l, time: null })), total));
    setSelected(sungIndexes[0]);
  };

  const clearAll = () => {
    commit(lines.map((l) => ({ ...l, time: null })));
    setSelected(sungIndexes[0]);
    audio.seek(0);
    setPlaying(false);
  };

  // Atajos: Espacio/Enter marca, Retroceso deshace, ← → mueven 5 s,
  // ↑ ↓ adelantan/atrasan la línea seleccionada.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        mark();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        undo();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        audio.seek(audio.time - 5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        audio.seek(audio.time + 5);
      } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && selected !== undefined) {
        e.preventDefault();
        nudge(selected, e.key === "ArrowUp" ? -NUDGE_SECONDS : NUDGE_SECONDS);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const iconButton =
    "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 cursor-pointer";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={!ready}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-40 cursor-pointer"
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {!ready ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>
        <span className="font-mono text-xs tabular-nums text-zinc-400">
          {formatTimestamp(audio.time).slice(1, -1)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={autoFill} title="Rellenar con tiempos automáticos" className={iconButton}>
            <Wand2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={undo} disabled={history.length === 0} title="Deshacer (Retroceso)" className={iconButton}>
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={clearAll} title="Borrar todos los tiempos" className={iconButton}>
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ol className="max-h-80 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-sm leading-relaxed">
        {lines.map((line, i) => {
          if (!isSungLine(line)) {
            return (
              <li key={i} className="px-2 py-0.5 text-xs text-zinc-600">
                {line.text || " "}
              </li>
            );
          }
          const isSelected = i === selected;
          const isPlayingLine = i === playingLine && playing;
          return (
            <li
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={`group flex items-center gap-2 rounded-md px-2 py-1 ${isSelected ? "bg-emerald-500/15 ring-1 ring-emerald-500/40" : "hover:bg-zinc-800/60"}`}
            >
              <span className="w-14 shrink-0 font-mono text-[11px] tabular-nums text-emerald-400/80">
                {line.time !== null ? formatTimestamp(line.time).slice(1, -1) : "--:--.--"}
              </span>
              <button
                type="button"
                onClick={() => selectLine(i)}
                className={`flex-1 text-left cursor-pointer ${isPlayingLine ? "text-white font-semibold" : line.time !== null ? "text-zinc-300" : "text-zinc-500"}`}
              >
                {line.text}
              </button>
              {line.time !== null && (
                <span className={`flex shrink-0 items-center ${isSelected ? "" : "opacity-0 group-hover:opacity-100"}`}>
                  <button
                    type="button"
                    onClick={() => nudge(i, -NUDGE_SECONDS)}
                    title="Antes (↑)"
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-white cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(i, NUDGE_SECONDS)}
                    title="Después (↓)"
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-white cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={mark}
          disabled={!ready || selected === undefined}
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
        >
          {selected === undefined ? "Toca una línea para corregirla" : "Marcar línea (Espacio)"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 cursor-pointer"
        >
          Listo
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-500">
        <Wand2 className="inline h-3 w-3" /> pone tiempos automáticos. Toca una línea para escucharla;
        si entra antes o después, ajústala con <kbd className="text-zinc-300">− +</kbd> (o{" "}
        <kbd className="text-zinc-300">↑ ↓</kbd>), o pulsa <kbd className="text-zinc-300">Espacio</kbd>{" "}
        justo cuando empiece. <kbd className="text-zinc-300">← →</kbd> mueven 5 s. Después pulsa Guardar.
      </p>
    </div>
  );
}
