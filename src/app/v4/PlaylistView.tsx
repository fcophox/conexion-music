"use client";

import { useState } from "react";
import { ChevronDown, Music, Pause, Play, Plus } from "lucide-react";
import type { Album, Track } from "@/lib/catalog-types";
import { albumCover, trackImage } from "./covers";
import { DragRow } from "./DragRow";
import type { V4Player } from "./useV4Player";

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs} min`;
}

type Props = {
  albums: Album[];
  player: V4Player;
  onOpenPlayer: () => void;
};

export function PlaylistView({ albums, player, onOpenPlayer }: Props) {
  const [albumId, setAlbumId] = useState(albums[0]?.id);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const album = albums.find((a) => a.id === albumId) ?? albums[0];

  if (!album) {
    return (
      <section className="flex flex-1 items-center justify-center text-zinc-500">
        No hay discos disponibles.
      </section>
    );
  }

  const handleSelect = (id: string) => {
    setAlbumId(id);
    setIsPickerOpen(false);
  };

  return (
    <section className="flex flex-1 flex-col animate-fade-in">
      {/* Título "Playlist" (en la misma posición que "Discos") y, debajo, el
          selector de disco con el "+", en el mismo ancho centrado */}
      <header className="relative z-10 px-24 py-8 sm:px-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-black tracking-tight text-white">Playlist</h1>
          <div className="relative mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsPickerOpen((open) => !open)}
              aria-expanded={isPickerOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-1.5 rounded-lg font-bold tracking-tight text-white transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {album.title}
              <ChevronDown
                className={`size-4 text-zinc-500 transition-transform duration-200 ${isPickerOpen ? "rotate-180" : ""}`}
              />
            </button>

            <button
              type="button"
              aria-label="Elegir disco"
              onClick={() => setIsPickerOpen((open) => !open)}
              className="flex size-9 items-center justify-center rounded-full text-white transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className={`size-5 transition-transform duration-200 ${isPickerOpen ? "rotate-45" : ""}`} />
            </button>

            {isPickerOpen && (
              <ul
                role="listbox"
                aria-label="Discos"
                className="absolute left-0 top-full mt-2 min-w-56 origin-top-left rounded-xl border border-white/10 bg-zinc-900/95 p-1 shadow-xl shadow-black/50 backdrop-blur animate-scale-in"
              >
                {albums.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={a.id === album.id}
                      onClick={() => handleSelect(a.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm font-bold tracking-tight transition-colors hover:bg-white/5 ${a.id === album.id ? "text-white" : "text-zinc-400"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={albumCover(a)} alt="" className="size-8 rounded-md object-cover" />
                      {a.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* Deja espacio abajo para el mini reproductor cuando está visible */}
      <div
        className={`flex flex-1 items-center transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${player.track ? "pb-48" : ""}`}
      >
        <TrackRow
          key={album.id}
          items={album.tracks.map((track, index) => ({ track, album, index }))}
          player={player}
          onOpenPlayer={onOpenPlayer}
        />
      </div>
    </section>
  );
}

// Una canción con su disco y su posición en él (la búsqueda mezcla discos).
export type TrackItem = { track: Track; album: Album; index: number };

type TrackRowProps = {
  items: TrackItem[];
  player: V4Player;
  onOpenPlayer: () => void;
};

// Fila de tarjetas de canciones. La usan la playlist de un disco y la búsqueda.
export function TrackRow({ items, player, onOpenPlayer }: TrackRowProps) {
  return (
    <DragRow>
      {items.map(({ track, album, index }) => {
        const isCurrent =
          player.album?.id === album.id && player.track?.id === track.id;
        return (
          <TrackCard
            key={track.id}
            track={track}
            album={album}
            number={index + 1}
            isCurrent={isCurrent}
            isPlaying={isCurrent && player.isPlaying}
            isAvailable={player.isAvailable(track.id)}
            onPlay={() => {
              player.playTrack(album, index);
              onOpenPlayer();
            }}
          />
        );
      })}
    </DragRow>
  );
}

type TrackCardProps = {
  track: Track;
  album: Album;
  number: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isAvailable: boolean;
  onPlay: () => void;
};

function TrackCard({
  track,
  album,
  number,
  isCurrent,
  isPlaying,
  isAvailable,
  onPlay,
}: TrackCardProps) {
  const imageOpacity = isCurrent
    ? "opacity-100"
    : isAvailable
      ? "opacity-60 group-hover:opacity-100"
      : "opacity-25";
  const overlayOpacity = isCurrent
    ? "opacity-100"
    : "translate-y-1 scale-90 opacity-0 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100";
  const label = `Reproducir ${track.title}`;

  return (
    <li className="group w-52 shrink-0 sm:w-60">
      <button
        type="button"
        // aria-disabled en vez de disabled: así se puede arrastrar desde la tarjeta.
        onClick={isAvailable ? onPlay : undefined}
        aria-disabled={!isAvailable}
        aria-label={label}
        aria-current={isCurrent ? "true" : undefined}
        className="block w-full text-left focus-visible:outline-none"
      >
        <div
          className={`relative aspect-[4/5] overflow-hidden rounded-3xl bg-zinc-900 ring-white/40 transition-[scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-visible:ring-2 ${isCurrent ? "scale-[0.94]" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trackImage(track, album)}
            alt=""
            loading="lazy"
            draggable={false}
            className={`size-full object-cover transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none ${imageOpacity}`}
          />
          <span className="absolute left-4 top-3.5 text-[0.65rem] text-white/60">
            {album.year}
          </span>
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[0.65rem] font-medium text-white/80 backdrop-blur">
            <Music className="size-2.5" />
            {number}
          </span>

          {isAvailable && (
            <span
              className={`absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-white text-zinc-950 shadow-lg shadow-black/40 transition-[opacity,scale,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-[0.92] motion-reduce:transition-none ${overlayOpacity}`}
            >
              {isPlaying ? (
                <Pause className="size-4" fill="currentColor" />
              ) : (
                <Play className="size-4 translate-x-px" fill="currentColor" />
              )}
            </span>
          )}
        </div>

        <div className="mt-3 px-3">
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[0.6rem] text-zinc-500">
            {album.title}
          </span>
          <p
            className={`mt-1.5 truncate text-sm font-normal transition-colors duration-300 ${isCurrent ? "text-emerald-400" : "text-zinc-300 group-hover:text-white"}`}
          >
            {track.title}
          </p>
          <p className="text-[0.65rem] font-medium text-zinc-500 tabular-nums">
            {isAvailable ? formatDuration(track.duration) : "Sin audio"}
          </p>
        </div>
      </button>
    </li>
  );
}
