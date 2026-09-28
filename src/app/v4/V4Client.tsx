"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Album } from "@/lib/catalog-types";
import { AlbumsView } from "./AlbumsView";
import { HeroView } from "./HeroView";
import { NowPlaying } from "./NowPlaying";
import { PlayerView } from "./PlayerView";
import { PlaylistView } from "./PlaylistView";
import { SearchView } from "./SearchView";
import { SideMenu, type MenuItemId } from "./SideMenu";
import { useLikes } from "./useLikes";
import { useV4Player } from "./useV4Player";

type Props = {
  albums: Album[];
};

export function V4Client({ albums }: Props) {
  const [view, setView] = useState<MenuItemId>("home");
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  // El reproductor vive aquí para que la música siga al cambiar de vista.
  const player = useV4Player();
  const likes = useLikes();

  const openPlayer = useCallback(() => setIsPlayerOpen(true), []);
  const closePlayer = useCallback(() => setIsPlayerOpen(false), []);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <SideMenu active={view} onChange={setView} />
      {view === "music" && (
        <PlaylistView albums={albums} player={player} onOpenPlayer={openPlayer} />
      )}
      {view === "albums" && (
        <AlbumsView albums={albums} player={player} onOpenPlayer={openPlayer} />
      )}
      {view === "search" && (
        <SearchView albums={albums} player={player} onOpenPlayer={openPlayer} />
      )}
      {(view === "home" || view === "x") && <HeroView />}
      {!isPlayerOpen && <NowPlaying player={player} onOpen={openPlayer} />}
      <AnimatePresence>
        {isPlayerOpen && player.track && (
          <PlayerView key="player" player={player} likes={likes} onClose={closePlayer} />
        )}
      </AnimatePresence>
    </main>
  );
}
