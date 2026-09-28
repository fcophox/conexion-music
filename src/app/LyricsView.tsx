"use client";

import { useEffect, useMemo, useRef } from "react";
import { activeLineIndex, estimateTimings, isSynced, parseLyrics } from "@/lib/lyrics";

/**
 * Letra de una canción. Mientras suena, resalta la línea actual, la mantiene
 * centrada y permite saltar a una línea tocándola. Usa las marcas LRC
 * guardadas desde el panel; si la letra no tiene, estima los tiempos a
 * partir de la duración.
 */
export default function LyricsView({
  lyrics,
  time,
  duration,
  isCurrent,
  onSeek,
  className,
}: {
  lyrics: string;
  time: number;
  duration: number;
  // true si esta canción es la cargada en el reproductor
  isCurrent: boolean;
  onSeek: (seconds: number) => void;
  className?: string;
}) {
  const lines = useMemo(() => {
    const parsed = parseLyrics(lyrics);
    return isSynced(parsed) ? parsed : estimateTimings(parsed, duration);
  }, [lyrics, duration]);
  const synced = isSynced(lines);
  const active = synced && isCurrent ? activeLineIndex(lines, time) : -1;
  const lineRefs = useRef<(HTMLElement | null)[]>([]);

  // Si el usuario está desplazando la letra a mano, no le quitamos el control
  // durante unos segundos.
  const userScrollUntil = useRef(0);
  useEffect(() => {
    const markUserScroll = () => {
      userScrollUntil.current = Date.now() + 4000;
    };
    window.addEventListener("wheel", markUserScroll, { passive: true });
    window.addEventListener("touchmove", markUserScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", markUserScroll);
      window.removeEventListener("touchmove", markUserScroll);
    };
  }, []);

  useEffect(() => {
    if (active < 0 || Date.now() < userScrollUntil.current) return;
    const el = lineRefs.current[active];
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [active]);

  if (!synced) {
    return <div className={`whitespace-pre-line ${className ?? ""}`}>{lyrics}</div>;
  }

  const highlighting = active >= 0;

  return (
    <div className={className}>
      {lines.map((line, i) => {
        if (!line.text.trim()) return <div key={i} className="h-[1lh]" aria-hidden />;

        const isActive = i === active;
        const stateClass = isActive
          ? "text-white"
          : highlighting
            ? i < active
              ? "text-zinc-500"
              : "text-zinc-600"
            : "";

        if (line.time === null || !isCurrent) {
          return (
            <p
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={`transition-colors duration-300 ${stateClass}`}
            >
              {line.text}
            </p>
          );
        }

        const lineTime = line.time;
        return (
          <p key={i} ref={(el) => { lineRefs.current[i] = el; }}>
            <button
              type="button"
              onClick={() => onSeek(lineTime)}
              aria-current={isActive ? "true" : undefined}
              className={`text-left cursor-pointer origin-left transition-[color,transform] duration-300 ease-out hover:text-zinc-200 motion-reduce:transition-none ${stateClass} ${isActive ? "scale-[1.04] hover:text-white" : ""}`}
            >
              {line.text}
            </button>
          </p>
        );
      })}
    </div>
  );
}
