"use client";

import { useRef } from "react";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import { PlayerControls } from "./PlayerControls";
import type { V4Player } from "./useV4Player";

// Al soltar el handle se abre si se subió lo suficiente o con un gesto rápido.
const OPEN_OFFSET = 60;
const OPEN_VELOCITY = 500;
// Recorrido mínimo para que cuente el gesto rápido (evita aperturas por error).
const FLICK_MIN_OFFSET = 24;

type Props = {
  player: V4Player;
  onOpen: () => void;
};

// Mini reproductor flotante: los mismos controles que el reproductor completo,
// sin fondo ni borde. El handle (tocándolo o arrastrándolo hacia arriba) o el
// título lo abren.
export function NowPlaying({ player, onOpen }: Props) {
  const dragControls = useDragControls();
  // Evita que el clic final de un arrastre abra la vista por su cuenta.
  const didDragRef = useRef(false);

  const { track, album } = player;
  if (!track || !album) return null;

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const isFlick =
      info.velocity.y < -OPEN_VELOCITY && info.offset.y < -FLICK_MIN_OFFSET;
    if (info.offset.y < -OPEN_OFFSET || isFlick) {
      onOpen();
    }
  };

  const handleHandleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onOpen();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <motion.div
        className="pointer-events-auto w-full max-w-[22rem] animate-scale-in"
        // Se arrastra solo desde el handle; hacia abajo no se mueve.
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragStart={() => {
          didDragRef.current = true;
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="px-5 pb-2">
          <button
            type="button"
            aria-label="Abrir reproductor (arrastra hacia arriba)"
            onClick={handleHandleClick}
            onPointerDown={(e) => {
              didDragRef.current = false;
              dragControls.start(e);
            }}
            className="group/handle mx-auto block cursor-grab touch-none px-8 pb-2 pt-2.5 active:cursor-grabbing"
          >
            <span className="block h-1 w-9 rounded-full bg-white/60 transition-[width,background-color] duration-200 group-hover/handle:w-12 group-hover/handle:bg-white group-active/handle:w-12 group-active/handle:bg-white" />
          </button>
          <PlayerControls player={player} onTitleClick={onOpen} isCompact />
        </div>
      </motion.div>
    </div>
  );
}
