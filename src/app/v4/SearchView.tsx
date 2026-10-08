"use client";

import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Album } from "@/lib/catalog-types";
import { TrackRow, type TrackItem } from "./PlaylistView";
import type { V4Player } from "./useV4Player";

// Sin tildes ni mayúsculas: "dias" encuentra "Días grises". NFC primero porque
// algunos títulos vienen guardados con los acentos descompuestos.
function normalize(text: string) {
  return text
    .normalize("NFC")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

type Props = {
  albums: Album[];
  player: V4Player;
  onOpenPlayer: () => void;
};

// Buscador: escribe y muestra en una fila, como la playlist, las canciones
// cuyo título empieza con lo escrito (el nombre del disco no cuenta).
export function SearchView({ albums, player, onOpenPlayer }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo<TrackItem[]>(
    () =>
      albums.flatMap((album) =>
        album.tracks.map((track, index) => ({ track, album, index }))
      ),
    [albums]
  );

  const needle = normalize(query);
  const results = needle
    ? allItems.filter(({ track }) => normalize(track.title).startsWith(needle))
    : [];

  const resultLabel =
    results.length === 1 ? "1 canción" : `${results.length} canciones`;

  return (
    <section className="flex flex-1 flex-col animate-fade-in">
      <header className="relative z-10 px-24 py-8 sm:px-32">
        <div className="mx-auto max-w-3xl">
          <label className="group flex items-center gap-3 border-b border-white/15 pb-3 transition-colors focus-within:border-white/60">
            <Search className="size-5 shrink-0 text-white/50 transition-colors group-focus-within:text-white" />
            <input
              ref={inputRef}
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canciones"
              aria-label="Buscar canciones"
              className="min-w-0 flex-1 bg-transparent text-xl text-white placeholder:text-white/30 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Borrar búsqueda"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="flex size-8 items-center justify-center rounded-full text-white/50 transition-[background-color,color] duration-150 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
          <p className="mt-2 h-5 text-xs text-white/40" aria-live="polite">
            {needle ? resultLabel : ""}
          </p>
        </div>
      </header>

      <div
        className={`flex flex-1 items-center transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${player.track ? "pb-60" : ""}`}
      >
        {results.length > 0 ? (
          <TrackRow
            key={needle}
            items={results}
            player={player}
            onOpenPlayer={onOpenPlayer}
          />
        ) : (
          <p className="w-full px-24 text-center text-white/40 sm:px-32">
            {needle
              ? `No hay canciones que coincidan con “${query.trim()}”.`
              : "Escribe el nombre de una canción."}
          </p>
        )}
      </div>
    </section>
  );
}
