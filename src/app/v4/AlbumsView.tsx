"use client";

import { useState, type ReactNode } from "react";
import { Pause, Play, Undo2 } from "lucide-react";
import type { Album } from "@/lib/catalog-types";
import { albumCover } from "./covers";
import { DragRow } from "./DragRow";
import type { V4Player } from "./useV4Player";

function albumDuration(album: Album) {
  const total = album.tracks.reduce((sum, t) => sum + t.duration, 0);
  const mins = Math.floor(total / 60);
  return mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`;
}

function trackCount(album: Album) {
  const n = album.tracks.length;
  return n === 1 ? "1 canción" : `${n} canciones`;
}

// Separa la primera frase (sirve de título de sección) del resto del texto.
function splitFirstSentence(text: string) {
  const match = text.match(/^(.+?[.!?…])\s+([\s\S]*)$/);
  return match ? { lead: match[1], rest: match[2].trim() } : { lead: text, rest: "" };
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

type Props = {
  albums: Album[];
  player: V4Player;
  onOpenPlayer: () => void;
};

// Discos: una fila con todos y, al tocar uno, su ficha con la información.
export function AlbumsView({ albums, player, onOpenPlayer }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = albums.find((a) => a.id === selectedId);

  if (selected) {
    return (
      <AlbumDetail
        key={selected.id}
        album={selected}
        player={player}
        onOpenPlayer={onOpenPlayer}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const countLabel = albums.length === 1 ? "1 disco" : `${albums.length} discos`;

  return (
    <section className="flex flex-1 flex-col animate-fade-in">
      <header className="relative z-10 px-24 py-8 sm:px-32">
        <div className="mx-auto flex max-w-3xl items-baseline justify-between">
          <h1 className="text-white">Discos</h1>
          <span className="text-xs text-white/40">{countLabel}</span>
        </div>
      </header>

      <div
        className={`flex flex-1 items-center transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${player.track ? "pb-48" : ""}`}
      >
        <DragRow>
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              isPlaying={player.album?.id === album.id && player.isPlaying}
              onSelect={() => setSelectedId(album.id)}
            />
          ))}
        </DragRow>
      </div>
    </section>
  );
}

type AlbumCardProps = {
  album: Album;
  isPlaying: boolean;
  onSelect: () => void;
};

function AlbumCard({ album, isPlaying, onSelect }: AlbumCardProps) {
  return (
    <li className="group w-60 shrink-0 sm:w-72">
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Ver información de ${album.title}`}
        className="block w-full text-left focus-visible:outline-none"
      >
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-zinc-900 ring-white/40 group-focus-visible:ring-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={albumCover(album)}
            alt=""
            loading="lazy"
            draggable={false}
            className="size-full object-cover opacity-70 transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:opacity-100 motion-reduce:transition-none"
          />
          <span className="absolute left-4 top-3.5 text-[0.65rem] text-white/60">
            {album.year}
          </span>
          {isPlaying && (
            <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[0.65rem] text-emerald-400 backdrop-blur">
              Sonando
            </span>
          )}
        </div>

        <div className="mt-3 px-3">
          <p className="truncate font-bold tracking-tight text-white/80 transition-colors duration-300 group-hover:text-white">
            {album.title}
          </p>
          <p className="text-[0.65rem] font-medium text-zinc-500">
            {trackCount(album)} · {albumDuration(album)}
          </p>
        </div>
      </button>
    </li>
  );
}

type AlbumDetailProps = {
  album: Album;
  player: V4Player;
  onOpenPlayer: () => void;
  onBack: () => void;
};

// Ficha de un disco: portada, textos del disco y lista de canciones.
function AlbumDetail({ album, player, onOpenPlayer, onBack }: AlbumDetailProps) {
  const intro = album.aboutIntro?.trim();
  const details = album.aboutDetails?.trim() || album.description?.trim();
  const story = details ? splitFirstSentence(details) : null;
  const firstPlayable = album.tracks.findIndex((t) => player.isAvailable(t.id));
  const isThisAlbum = player.album?.id === album.id;

  const playAt = (index: number) => {
    player.playTrack(album, index);
    onOpenPlayer();
  };

  const handlePlayAlbum = () => {
    if (isThisAlbum) {
      player.togglePlay();
    } else if (firstPlayable !== -1) {
      playAt(firstPlayable);
    }
  };

  const isAlbumPlaying = isThisAlbum && player.isPlaying;

  return (
    <section className="no-scrollbar relative h-dvh overflow-y-auto animate-fade-in">
      {/* Imagen de fondo del disco en la mitad derecha, desvanecida hacia la
          izquierda y hacia abajo */}
      {album.bgImage && (
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-[60vh] w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={album.bgImage} alt="" className="size-full object-cover object-right-top opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
      )}

      <div className={`relative px-24 py-8 sm:px-32 ${player.track ? "pb-56" : "pb-16"}`}>
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a los discos"
            className="flex size-10 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur transition-[background-color,color,scale] duration-200 hover:bg-black/50 hover:text-white active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Undo2 className="size-4" />
          </button>

          <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={albumCover(album)}
              alt={album.title}
              className="aspect-square w-56 shrink-0 rounded-3xl object-cover shadow-2xl shadow-black/60 sm:w-64"
            />
            <div className="min-w-0">
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[0.65rem] text-white/60">
                Disco · {album.year}
              </span>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">{album.title}</h1>
              <p className="mt-2 text-sm text-white/50">
                {album.artist} · {trackCount(album)} · {albumDuration(album)}
              </p>
              <button
                type="button"
                onClick={handlePlayAlbum}
                disabled={firstPlayable === -1 && !isThisAlbum}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm text-zinc-950 transition-[background-color,scale] duration-150 hover:bg-white/90 active:scale-[0.97] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isAlbumPlaying ? (
                  <Pause className="size-4" fill="currentColor" />
                ) : (
                  <Play className="size-4" fill="currentColor" />
                )}
                {isAlbumPlaying ? "Pausar" : "Reproducir"}
              </button>
            </div>
          </div>

          {/* Secciones del disco, cada una con su etiqueta y título */}
          <div className="mt-24 flex flex-col gap-24">
            {intro && (
              <InfoSection eyebrow="El concepto">
                <p className="leading-relaxed text-white/50">{intro}</p>
              </InfoSection>
            )}

            {story && (
              <InfoSection eyebrow="La historia" title={story.lead}>
                {story.rest && (
                  <p className="whitespace-pre-line leading-relaxed text-white/50">{story.rest}</p>
                )}
              </InfoSection>
            )}
          </div>
        </div>

        {/* Las canciones, en el mismo ancho que la ficha y la vista de Discos */}
        <div className="mx-auto mt-24 max-w-3xl">
          <InfoSection
            eyebrow="Las canciones"
            title={`${trackCount(album)} · ${albumDuration(album)}`}
          >
            <ol aria-label={`Canciones de ${album.title}`} className="-mx-3">
              {album.tracks.map((track, index) => {
                const isCurrent = isThisAlbum && player.track?.id === track.id;
                const isAvailable = player.isAvailable(track.id);
                const titleTone = isCurrent
                  ? "text-emerald-400"
                  : isAvailable
                    ? "text-white/80 group-hover:text-white"
                    : "text-white/30";
                return (
                  <li key={track.id}>
                    <button
                      type="button"
                      onClick={isAvailable ? () => playAt(index) : undefined}
                      aria-disabled={!isAvailable}
                      aria-current={isCurrent ? "true" : undefined}
                      className="group flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-white/5 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="w-5 text-right text-xs text-white/40 tabular-nums">
                        {index + 1}
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-sm font-normal transition-colors ${titleTone}`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-white/40 tabular-nums">
                        {isAvailable ? formatTime(track.duration) : "Sin audio"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </InfoSection>
        </div>
      </div>
    </section>
  );
}

type InfoSectionProps = {
  eyebrow: string;
  title?: string;
  children?: ReactNode;
};

// Sección de la ficha: etiqueta pequeña en ámbar arriba y, si lo hay, un
// título grande antes del contenido.
function InfoSection({ eyebrow, title, children }: InfoSectionProps) {
  return (
    <section>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-emerald-500">
        {eyebrow}
      </p>
      {title && (
        <h2 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
      )}
      {children && <div className={title ? "mt-8" : "mt-4"}>{children}</div>}
    </section>
  );
}
