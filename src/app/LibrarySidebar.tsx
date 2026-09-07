"use client";

import { Home, Library } from "lucide-react";
import { Cover } from "./Cover";
import type { AlbumWithStats } from "@/lib/catalog-types";

type Props = {
  albums: AlbumWithStats[];
  totalTracks: number;
  totalMinutes: number;
  isHomeActive: boolean;
  activeAlbumId?: string;
  onHome: () => void;
  onOpenAlbum: (albumId: string) => void;
};

// Biblioteca fija a la izquierda: acompaña tanto al home como a las páginas
// internas (disco, letra, sobre conexión, universo) en pantallas lg o mayores.
export default function LibrarySidebar({ albums, totalTracks, totalMinutes, isHomeActive, activeAlbumId, onHome, onOpenAlbum }: Props) {
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFC107]";

  return <aside className="my-3 ml-3 hidden w-[232px] shrink-0 flex-col overflow-y-auto rounded-xl bg-[#121212] p-4 text-white lg:flex xl:w-[264px]">
    <button onClick={onHome} aria-label="Ir al inicio" className={`mb-8 mt-3 self-start rounded ${focus}`}>
      <img src="/brand/conexionlogo.svg" alt="Conexión" className="h-7 w-auto" />
    </button>

    <nav aria-label="Navegación musical">
      <button onClick={onHome} className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 font-bold ${isHomeActive ? "bg-white/10 text-white" : "font-semibold text-zinc-400 hover:text-white"} ${focus}`}><Home size={21} />Inicio</button>
    </nav>

    <div className="mb-4 mt-8 flex items-center justify-between text-zinc-400"><span className="flex items-center gap-3 text-sm font-bold"><Library size={21} />Tu biblioteca</span><span className="text-xs">{albums.length}</span></div>

    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
      {albums.map(album => <button key={album.id} onClick={() => onOpenAlbum(album.id)} aria-current={activeAlbumId === album.id ? "true" : undefined} className={`flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors ${activeAlbumId === album.id ? "bg-white/10" : "hover:bg-white/5"} ${focus}`}><Cover album={album} className="h-11 w-11 rounded" /><span className="min-w-0"><span className={`block truncate text-sm font-semibold ${activeAlbumId === album.id ? "text-[#FFC107]" : ""}`}>{album.title}</span><span className="block truncate text-xs text-zinc-400">Álbum · {album.artist}</span></span></button>)}
    </div>

    <p className="mt-6 shrink-0 border-t border-white/10 pt-4 text-xs leading-6 text-zinc-500">{totalTracks} canciones para conectar.<br />{totalMinutes} minutos de música.</p>
  </aside>;
}
