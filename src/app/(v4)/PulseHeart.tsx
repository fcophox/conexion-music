"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";

// Parámetros del Pulse Heart de React Bits (con sus valores por defecto).
const DURATION = 0.56; // segundos de toda la animación
const FLIP_AT = 0.4; // el color cambia al 40 % del recorrido
const DOT_SIZE = 0.3; // qué tan chico queda el corazón justo en el cambio
const REBOUND = 1.18; // cuánto se pasa de su tamaño al volver
const BEAT = 0.97; // el botón se encoge un 3 % en el cambio
const LIKED_COLOR = "#ff4d6d";

type Props = {
  isLiked: boolean;
  onLike: () => void;
  label: string;
};

// "Me gusta" con corazón: en contorno mientras no hay like; al tocarlo se
// encoge hasta un punto, cambia a color lleno y rebota, y el botón late.
export function PulseHeart({ isLiked, onLike, label }: Props) {
  const reduceMotion = useReducedMotion();
  // Cambia en cada toque para repetir la animación.
  const [run, setRun] = useState(0);
  // Durante el primer tramo se sigue viendo el estado anterior.
  const [isFlipping, setIsFlipping] = useState(false);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    },
    []
  );

  const handleClick = () => {
    if (!isLiked && !reduceMotion) {
      setIsFlipping(true);
      flipTimeoutRef.current = setTimeout(
        () => setIsFlipping(false),
        DURATION * FLIP_AT * 1000
      );
    }
    onLike();
    setRun((n) => n + 1);
  };

  const isShownLiked = isLiked && !isFlipping;
  const shouldAnimate = run > 0 && !reduceMotion;
  const transition = { duration: DURATION, times: [0, FLIP_AT, 0.72, 1], ease: "easeOut" as const };

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isLiked}
      onClick={handleClick}
      className="group relative flex size-10 items-center justify-center rounded-full transition-[scale] duration-200 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Fondo del botón: late en el momento del cambio */}
      <motion.span
        key={`pill-${run}`}
        aria-hidden
        animate={shouldAnimate ? { scale: [1, BEAT, 1, 1] } : undefined}
        transition={transition}
        className="absolute inset-0 rounded-full bg-black/30 backdrop-blur transition-colors duration-200 group-hover:bg-black/50"
        style={isShownLiked ? { backgroundColor: `${LIKED_COLOR}33` } : undefined}
      />
      <motion.span
        key={`heart-${run}`}
        aria-hidden
        animate={shouldAnimate ? { scale: [1, DOT_SIZE, REBOUND, 1] } : undefined}
        transition={transition}
        className="relative flex"
      >
        <Heart
          className="size-4 text-white/80 transition-colors duration-200 group-hover:text-white"
          strokeWidth={2.5}
          style={isShownLiked ? { color: LIKED_COLOR } : undefined}
          fill={isShownLiked ? "currentColor" : "none"}
        />
      </motion.span>
    </button>
  );
}
