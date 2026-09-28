"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "framer-motion";
import { MessageSquareQuote, Undo2 } from "lucide-react";
import LyricsView from "../LyricsView";
import { HandIcon } from "./HandIcon";
import { trackImage } from "./covers";
import { PlayerControls } from "./PlayerControls";
import type { Likes } from "./useLikes";
import type { V4Player } from "./useV4Player";

const EASE = [0.22, 1, 0.36, 1] as const;
// Al soltar el handle se cierra si se bajó lo suficiente o con un gesto rápido.
const CLOSE_OFFSET = 140;
const CLOSE_VELOCITY = 600;
// Recorrido mínimo para que cuente el gesto rápido (evita cierres por error).
const FLICK_MIN_OFFSET = 40;

type Props = {
  player: V4Player;
  likes: Likes;
  onClose: () => void;
};

// Reproductor a pantalla completa: la imagen de la canción desenfocada de
// fondo, la carátula al centro y los controles debajo. Con el botón de letra,
// la carátula se corre a la izquierda y la letra aparece a la derecha.
export function PlayerView({ player, likes, onClose }: Props) {
  const { track, album } = player;
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  // Evita que el clic final de un arrastre cierre la vista por su cuenta.
  const didDragRef = useRef(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const isFlick =
      info.velocity.y > CLOSE_VELOCITY && info.offset.y > FLICK_MIN_OFFSET;
    if (info.offset.y > CLOSE_OFFSET || isFlick) {
      onClose();
    }
  };

  const handleHandleClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!track || !album) return null;

  const image = trackImage(track, album);
  const rise = reduceMotion ? {} : { y: 24, scale: 0.96 };
  // Entra y sale deslizándose desde abajo, como una hoja.
  const sheetHidden = reduceMotion ? { opacity: 0 } : { y: "100%" };
  const sheetShown = reduceMotion ? { opacity: 1 } : { y: 0 };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Reproduciendo ${track.title}`}
      className="fixed inset-0 z-40 flex flex-col overflow-clip bg-black shadow-[0_-20px_60px_rgba(0,0,0,0.6)]"
      initial={sheetHidden}
      animate={sheetShown}
      exit={sheetHidden}
      transition={{ duration: 0.5, ease: EASE }}
      // overflow-clip (no hidden): así el auto-scroll de la letra no desplaza
      // toda la vista.
      // Se arrastra solo desde el handle; hacia arriba no se mueve.
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 1 }}
      onDragStart={() => {
        didDragRef.current = true;
      }}
      onDragEnd={handleDragEnd}
    >
      {/* Fondo: la misma imagen, muy desenfocada, con viñeta oscura */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={image}
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-3xl animate-fade-in"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.75)_85%)]"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

      <header className="relative flex items-center justify-between p-5">
        <button
          type="button"
          aria-label="Volver"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur transition-[background-color,color,scale] duration-200 hover:bg-black/50 hover:text-white active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Cerrar reproductor (arrastra hacia abajo)"
          onClick={handleHandleClick}
          onPointerDown={(e) => {
            didDragRef.current = false;
            dragControls.start(e);
          }}
          className="group/handle absolute left-1/2 top-3 -translate-x-1/2 cursor-grab touch-none px-8 py-4 active:cursor-grabbing"
        >
          <span className="block h-1 w-9 rounded-full bg-white/70 transition-[width,background-color] duration-200 group-hover/handle:w-12 group-hover/handle:bg-white group-active/handle:w-12 group-active/handle:bg-white" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isLyricsOpen ? "Ocultar letra" : "Ver letra"}
            aria-pressed={isLyricsOpen}
            onClick={() => setIsLyricsOpen((open) => !open)}
            className={`flex size-10 items-center justify-center rounded-full backdrop-blur transition-[background-color,color,scale] duration-200 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isLyricsOpen ? "bg-white text-zinc-950 hover:bg-white/90" : "bg-black/30 text-white/80 hover:bg-black/50 hover:text-white"}`}
          >
            <MessageSquareQuote className="size-4" />
          </button>
          <LikeButton
            isLiked={likes.isLiked(track.id)}
            onLike={() => likes.like(track.id)}
            trackTitle={track.title}
          />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 pb-10 md:flex-row md:gap-20">
        {/* Carátula y controles: se deslizan a la izquierda al abrir la letra */}
        <motion.div
          layout={!reduceMotion}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex shrink-0 flex-col items-center gap-10"
        >
          <motion.div
            key={track.id}
            initial={{ opacity: 0, ...rise }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            // En pantallas chicas la letra ocupa el lugar de la carátula.
            className={`aspect-square w-[min(18rem,70vw)] overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ${isLyricsOpen ? "hidden md:block" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={track.title} className="size-full object-cover" />
          </motion.div>

          <div className="w-[min(20rem,85vw)]">
            <PlayerControls player={player} />
          </div>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {isLyricsOpen && (
            <motion.aside
              key="lyrics"
              aria-label={`Letra de ${track.title}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="no-scrollbar order-first max-h-[45vh] w-full max-w-md overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] md:order-none md:h-[70vh] md:max-h-none"
            >
              {track.lyrics?.trim() ? (
                <LyricsView
                  key={track.id}
                  lyrics={track.lyrics}
                  time={player.time}
                  duration={player.duration}
                  isCurrent
                  onSeek={player.seek}
                  // LyricsView (compartido con la home) pinta en gris; aquí se
                  // pasa a blanco con opacidad y la línea actual, blanco pleno.
                  className="space-y-2 py-[20vh] text-xl font-medium leading-snug text-white/50 md:text-2xl [&_button:hover]:text-white/80 [&_button]:text-white/50 [&_p]:text-white/50 [&_[aria-current]]:text-white [&_[aria-current]:hover]:text-white"
                />
              ) : (
                <p className="flex h-full min-h-40 items-center justify-center text-center text-white/50">
                  Esta canción aún no tiene letra.
                </p>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

type LikeButtonProps = {
  isLiked: boolean;
  onLike: () => void;
  trackTitle: string;
};

// "Me gusta" con la mano rockera: mismo estilo que el botón de volver.
function LikeButton({ isLiked, onLike, trackTitle }: LikeButtonProps) {
  const reduceMotion = useReducedMotion();
  // Cambia en cada toque para repetir el pequeño salto del ícono.
  const [pulse, setPulse] = useState(0);

  const handleClick = () => {
    onLike();
    setPulse((n) => n + 1);
  };

  const tone = isLiked
    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
    : "bg-black/30 text-white/80 hover:bg-black/50 hover:text-white";

  return (
    <button
      type="button"
      aria-label={isLiked ? `Te gusta ${trackTitle}` : `Me gusta ${trackTitle}`}
      aria-pressed={isLiked}
      onClick={handleClick}
      className={`flex size-10 items-center justify-center rounded-full backdrop-blur transition-[background-color,color,scale] duration-200 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tone}`}
    >
      <motion.span
        key={pulse}
        initial={pulse && !reduceMotion ? { scale: 0.6, rotate: -12 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
        className="flex"
      >
        <HandIcon className="size-4" />
      </motion.span>
    </button>
  );
}
