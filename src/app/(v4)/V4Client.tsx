"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import type { Album } from "@/lib/catalog-types";
import { AlbumsView } from "./AlbumsView";
import { ExperienceView } from "./ExperienceView";
import { HeroView } from "./HeroView";
import { NowPlaying } from "./NowPlaying";
import { PlayerView } from "./PlayerView";
import { PlaylistView } from "./PlaylistView";
import { SearchModal } from "./SearchModal";
import { sectionDocumentTitle, sectionFromPath, sectionPath, type MenuItemId } from "./sections";
import { SideMenu } from "./SideMenu";
import { useLikes } from "./useLikes";
import { useV4Player } from "./useV4Player";

type Props = {
  albums: Album[];
};

export function V4Client({ albums }: Props) {
  // La sección sale de la dirección (/playlist, /albums, …), así cada
  // una se puede compartir y funcionan los botones atrás y adelante.
  const view = sectionFromPath(usePathname());

  // pushState cambia la dirección sin recargar, así la música no se corta.
  const setView = useCallback((id: MenuItemId) => {
    const path = sectionPath(id);
    if (window.location.pathname !== path) window.history.pushState(null, "", path);
  }, []);

  useEffect(() => {
    document.title = sectionDocumentTitle(view);
  }, [view]);

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // El reproductor vive aquí para que la música siga al cambiar de vista.
  const player = useV4Player();
  const likes = useLikes();

  const openPlayer = useCallback(() => setIsPlayerOpen(true), []);
  const closePlayer = useCallback(() => setIsPlayerOpen(false), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  // Al elegir un resultado se cierra la búsqueda y se abre el reproductor.
  const openPlayerFromSearch = useCallback(() => {
    setIsSearchOpen(false);
    setIsPlayerOpen(true);
  }, []);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <SideMenu
        active={view}
        onChange={setView}
        isSearchOpen={isSearchOpen}
        onSearch={() => setIsSearchOpen(true)}
      />
      {view === "music" && (
        <PlaylistView albums={albums} player={player} onOpenPlayer={openPlayer} />
      )}
      {view === "albums" && (
        <AlbumsView albums={albums} player={player} onOpenPlayer={openPlayer} />
      )}
      {view === "x" && <ExperienceView onBackHome={() => setView("home")} />}
      {view === "home" && <HeroView onStart={() => setView("music")} />}
      {!isPlayerOpen && <NowPlaying player={player} onOpen={openPlayer} />}
      <AnimatePresence>
        {isSearchOpen && (
          <SearchModal
            key="search"
            albums={albums}
            player={player}
            onOpenPlayer={openPlayerFromSearch}
            onClose={closeSearch}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPlayerOpen && player.track && (
          <PlayerView key="player" player={player} likes={likes} onClose={closePlayer} />
        )}
      </AnimatePresence>
    </main>
  );
}
