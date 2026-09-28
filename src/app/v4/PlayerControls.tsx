"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Music, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { V4Player } from "./useV4Player";

type Props = {
  player: V4Player;
  // Si se pasa, el título se vuelve un botón (lo usa el mini reproductor).
  onTitleClick?: () => void;
};

// Título, barra de progreso y controles. Lo comparten el reproductor completo
// y el mini reproductor flotante para que se vean iguales.
export function PlayerControls({ player, onTitleClick }: Props) {
  const { track, album, index, isPlaying, togglePlay, next, prev, hasNext } = player;
  if (!track || !album) return null;

  const title = onTitleClick ? (
    <button
      type="button"
      onClick={onTitleClick}
      aria-label={`Abrir reproductor: ${track.title}`}
      className="block max-w-full truncate rounded text-left font-normal text-white transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {track.title}
    </button>
  ) : (
    <p className="truncate font-normal text-white">{track.title}</p>
  );

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {title}
          <span className="mt-1 inline-block rounded-md bg-white/10 px-1.5 py-0.5 text-[0.6rem] text-white/60">
            {album.title}
          </span>
        </div>
        <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[0.65rem] font-medium text-white/80 backdrop-blur">
          <Music className="size-2.5" />
          {index + 1}
        </span>
      </div>

      <ProgressBar player={player} />

      <div className="mt-4 flex items-center justify-center gap-10">
        <ControlButton label="Anterior" onClick={prev}>
          <SkipBack className="size-6" fill="currentColor" />
        </ControlButton>
        <ControlButton label={isPlaying ? "Pausar" : "Reproducir"} onClick={togglePlay} isPrimary>
          {isPlaying ? (
            <Pause className="size-8" fill="currentColor" />
          ) : (
            <Play className="size-8 translate-x-0.5" fill="currentColor" />
          )}
        </ControlButton>
        <ControlButton label="Siguiente" onClick={next} isDisabled={!hasNext}>
          <SkipForward className="size-6" fill="currentColor" />
        </ControlButton>
      </div>
    </>
  );
}

type ControlButtonProps = {
  label: string;
  onClick: () => void;
  isPrimary?: boolean;
  isDisabled?: boolean;
  children: ReactNode;
};

function ControlButton({ label, onClick, isPrimary, isDisabled, children }: ControlButtonProps) {
  const tone = isPrimary ? "text-white" : "text-white/60 hover:text-white";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={isDisabled}
      className={`flex size-12 items-center justify-center rounded-full transition-[color,scale,opacity] duration-200 active:scale-[0.88] disabled:opacity-30 disabled:hover:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tone}`}
    >
      {children}
    </button>
  );
}

// Barra de progreso: clic o arrastre para moverse en la canción.
function ProgressBar({ player }: { player: V4Player }) {
  const { time, duration, seek } = player;
  const barRef = useRef<HTMLDivElement>(null);
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  // Ref además del estado: los eventos pueden llegar antes del siguiente render.
  const isDraggingRef = useRef(false);

  const fractionAt = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setDragFraction(fractionAt(e.clientX));
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) setDragFraction(fractionAt(e.clientX));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    seek(fractionAt(e.clientX) * duration);
    setDragFraction(null);
  };

  const played = duration > 0 ? Math.min(1, time / duration) : 0;
  const fraction = dragFraction ?? played;

  return (
    <div
      ref={barRef}
      role="slider"
      aria-label="Progreso"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(fraction * duration)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") seek(time + 5);
        if (e.key === "ArrowLeft") seek(time - 5);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        isDraggingRef.current = false;
        setDragFraction(null);
      }}
      className="group/bar mt-6 cursor-pointer touch-none py-2 focus-visible:outline-none"
    >
      <div className="relative h-1.5 rounded-full bg-white/20">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
          style={{ width: `${fraction * 100}%` }}
        />
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-[scale] duration-150 group-hover/bar:scale-125 group-focus-visible/bar:scale-125"
          style={{ left: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
