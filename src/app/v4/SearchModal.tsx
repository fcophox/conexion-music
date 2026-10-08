"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import type { Album } from "@/lib/catalog-types";
import { TrackRow, type TrackItem } from "./PlaylistView";
import type { V4Player } from "./useV4Player";

const EASE = [0.22, 1, 0.36, 1] as const;

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
  onClose: () => void;
};

// Buscador en un modal: oscurece la sección de fondo, muestra el campo arriba
// y, debajo, en una fila como la playlist, las canciones cuyo título empieza
// con lo escrito (el nombre del disco no cuenta).
export function SearchModal({ albums, player, onOpenPlayer, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

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
  const emptyMessage = needle
    ? `No hay canciones que coincidan con “${query.trim()}”.`
    : "Escribe el nombre de una canción.";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar canciones"
      className="fixed inset-0 z-[35] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {/* Fondo oscuro (del color de la página, para que el desvanecido de la
          fila no se note): un clic aquí cierra el modal */}
      <button
        type="button"
        aria-label="Cerrar búsqueda"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/90 backdrop-blur-sm"
      />

      {/* El contenido deja pasar los clics al fondo salvo en campo y tarjetas */}
      <div className="pointer-events-none relative flex flex-1 flex-col pt-[18vh]">
        <motion.div
          className="pointer-events-auto mx-auto w-full max-w-xl px-6"
          initial={reduceMotion ? false : { y: -16, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-5 shadow-2xl shadow-black/60">
            <Search className="size-5 shrink-0 text-zinc-500" />
            <input
              ref={inputRef}
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              aria-label="Buscar canciones"
              className="min-w-0 flex-1 bg-transparent text-lg text-zinc-950 placeholder:text-zinc-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Borrar búsqueda"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition-[background-color,color] duration-150 hover:bg-zinc-200 hover:text-zinc-950"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
          <p className="mt-3 h-5 text-center text-xs text-white/50" aria-live="polite">
            {needle ? resultLabel : ""}
          </p>
        </motion.div>

        <div className="mt-8">
          {results.length > 0 ? (
            <div className="pointer-events-auto">
              <TrackRow
                key={needle}
                items={results}
                player={player}
                onOpenPlayer={onOpenPlayer}
              />
            </div>
          ) : (
            <p className="px-6 text-center text-white/50">{emptyMessage}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
