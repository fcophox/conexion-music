"use client";

import { useState } from "react";
import { Music2, Pause, Play, Search, Shuffle } from "lucide-react";
import { Cover } from "./Cover";
import type { AlbumWithStats } from "@/lib/catalog-types";

type Props = {
  albums: AlbumWithStats[];
  greeting: string;
  totalAlbums: number;
  totalTracks: number;
  totalMinutes: number;
  currentTrackId?: number;
  isPlaying: boolean;
  onPlay: (album: AlbumWithStats, index: number) => void;
  onOpenAlbum: (albumId: string) => void;
  /** Background image URL to display (driven by hover from parent) */
  currentBg?: string;
  /** Called when a disc is hovered / unhovered */
  onHoverAlbum?: (albumId: string | null) => void;
  /** All background images to preload for crossfade */
  bgImages?: string[];
};

export default function AltHomeView({ albums, greeting, totalTracks, totalMinutes, currentTrackId, isPlaying, onPlay, onOpenAlbum, currentBg, onHoverAlbum, bgImages = [] }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todo");
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const needle = normalize(query.trim());
  const visibleAlbums = albums.filter(a => normalize(`${a.title} ${a.artist}`).includes(needle));
  const tracks = albums.flatMap(album => album.tracks.map((track, index) => ({ album, track, index })));
  const visibleTracks = tracks.filter(({ track }) => normalize(`${track.title} ${track.artist} ${track.album}`).includes(needle));
  const popular = [...visibleTracks].sort((a, b) => b.track.plays - a.track.plays).slice(0, query ? 20 : 6);
  // Random selection runs only in the click handler, never during render.
  // eslint-disable-next-line react-hooks/purity
  const handleRandomPlay = () => { const pick = tracks[Math.floor(Math.random() * tracks.length)]; if (pick) onPlay(pick.album, pick.index); };
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFC107]";

  // All unique bg images to preload for crossfade
  const allBgs = Array.from(new Set([...bgImages, currentBg].filter(Boolean))) as string[];

  return <div className="relative z-10 flex-1 min-h-0 w-full bg-[#080808] p-2 text-white md:p-3 flex flex-col">
    <div className="mx-auto max-w-[1800px] w-full flex-1 flex flex-col min-h-0">
      <div className="relative flex-1 min-w-0 overflow-y-auto overflow-x-hidden rounded-xl bg-[#121212]">
        
        <div className="pb-48 md:pb-52">
          {/* Crossfade background image — top right, inside the card */}
          <div className="absolute top-0 right-0 w-full md:w-3/5 lg:w-[750px] xl:w-[850px] max-w-full h-[420px] md:h-[500px] overflow-hidden pointer-events-none z-0 hidden md:block">
            {allBgs.map((bg) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={bg}
                src={bg}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover object-[right_top] transition-opacity duration-700 ease-in-out pointer-events-none ${bg === currentBg ? 'opacity-30' : 'opacity-0'}`}
              />
            ))}
            {/* Fade edges into card bg */}
            <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-[#121212] to-transparent z-10" />
            <div className="absolute left-0 right-0 bottom-0 h-1/3 bg-gradient-to-t from-[#121212] to-transparent z-10" />
          </div>

          <header className="relative z-10 flex flex-wrap items-center gap-3 p-4 md:px-7 md:py-5 lg:flex-nowrap">
            <img src="/brand/conexionlogo.svg" alt="Conexión" className="h-6 w-auto lg:hidden" />
            {/* El buscador ocupa el extremo izquierdo; en páginas internas lo reemplaza el botón volver. */}
            <label className="order-3 flex h-12 w-full items-center gap-3 rounded-full border border-transparent bg-black/65 px-4 text-zinc-300 shadow-xl shadow-black/50 backdrop-blur-xl focus-within:border-white/60 lg:order-none lg:max-w-md">
              <Search size={20} className="shrink-0" /><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar discos o canciones" placeholder="¿Qué quieres escuchar?" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-400" />
            </label>
          </header>

          <section className="relative z-10 px-4 pb-8 pt-2 md:px-7">
            <div className="mb-7 flex gap-2">{["Todo", "Discos", "Canciones"].map(item => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)} className={`min-h-10 rounded-full px-4 text-sm font-medium ${filter === item ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"} ${focus}`}>{item}</button>)}</div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-xs font-semibold tracking-widest text-[#FFD54F] uppercase">Tu música. Tu conexión.</p><h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{query ? `Resultados para "${query}"` : greeting}</h1></div><button onClick={handleRandomPlay} disabled={!tracks.length} className={`flex min-h-11 items-center gap-2 rounded-full bg-[#FFC107] px-5 text-sm font-bold text-black hover:bg-[#FFD54F] disabled:opacity-40 ${focus}`}><Shuffle size={17} />Canción aleatoria</button></div>
          </section>

          {filter !== "Canciones" && <section aria-label="Discos" className="relative z-10 px-4 pb-8 md:px-7"><div className="mb-4 flex items-baseline justify-between"><h2 className="text-xl font-bold tracking-tight">{query ? "Discos" : "Encuentra tu próximo favorito"}</h2><span className="text-xs text-zinc-400">{visibleAlbums.length} discos</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{visibleAlbums.map(album => <article key={album.id} className="group min-w-0 rounded-lg p-2 transition-colors hover:bg-[#202020] md:p-3" onMouseEnter={() => onHoverAlbum?.(album.id)} onMouseLeave={() => onHoverAlbum?.(null)}><div className="relative"><button onClick={() => onOpenAlbum(album.id)} aria-label={`Abrir ${album.title}`} className={`block w-full rounded-md ${focus}`}><Cover album={album} className="aspect-square w-full rounded-md shadow-lg" /></button><button disabled={!album.tracks.length} onClick={() => onPlay(album, 0)} aria-label={`Reproducir ${album.title}`} className={`absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFC107] text-black shadow-lg transition-transform hover:scale-105 disabled:opacity-40 ${focus}`}><Play size={21} fill="currentColor" /></button></div><button onClick={() => onOpenAlbum(album.id)} className={`mt-3 block w-full truncate text-left text-sm font-bold hover:underline ${focus}`}>{album.title}</button><p className="mt-1 truncate text-xs text-zinc-400">{album.year} · {album.artist}</p></article>)}</div>{!visibleAlbums.length && <p className="py-6 text-sm text-zinc-400">No hay discos que coincidan con tu búsqueda.</p>}</section>}

          {filter !== "Discos" && <section aria-label="Canciones" className="relative z-10 px-4 pb-8 md:px-7"><h2 className="mb-4 text-xl font-bold tracking-tight">{query ? "Canciones" : "Las más escuchadas"}</h2><div>{popular.map(({ album, track, index }, rank) => { const active = currentTrackId === track.id; return <button key={`${album.id}-${track.id}`} onClick={() => onPlay(album, index)} aria-label={`${active && isPlaying ? "Pausar" : "Reproducir"} ${track.title}`} className={`group flex min-h-16 w-full items-center gap-3 rounded-md px-2 text-left hover:bg-white/5 md:px-3 ${focus}`}><span className="hidden w-5 shrink-0 text-center text-sm text-zinc-500 sm:block">{rank + 1}</span><Cover album={album} className="h-11 w-11 rounded" /><span className="min-w-0 flex-1"><span className={`block truncate text-sm font-semibold ${active ? "text-[#FFC107]" : ""}`}>{track.title}</span><span className="block truncate text-xs text-zinc-400">{track.artist}</span></span><span className="hidden w-1/4 truncate text-xs text-zinc-400 md:block">{album.title}</span><span className="text-xs tabular-nums text-zinc-400">{Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}</span>{active && isPlaying ? <Pause size={16} className="text-[#FFC107]" /> : <Play size={16} className="text-zinc-400" />}</button>; })}</div>{!popular.length && <div className="flex items-center gap-3 py-8 text-sm text-zinc-400"><Music2 size={20} />No se encontraron canciones.</div>}</section>}
        </div>
      </div>
    </div>
  </div>;
}
