"use client";

import type { PointerEvent, ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

// Mismos valores por defecto que el Flip Card de React Bits.
const TILT_MAX = 12; // grados
const HOVER_SCALE = 1.03;
const GLARE_OPACITY = 0.22;
const PERSPECTIVE = 1100; // px
const SPRING = { stiffness: 170, damping: 20 };

type Props = {
  className?: string;
  children: ReactNode;
};

// Superficie de una tarjeta con el efecto de hover del Flip Card: se inclina
// en 3D hacia el cursor, se levanta un poco y un brillo sigue al mouse.
export function TiltCard({ className, children }: Props) {
  const reduceMotion = useReducedMotion();
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const scale = useSpring(1, SPRING);
  const glareOpacity = useSpring(0, SPRING);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.9), transparent 60%)`;

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // Solo con mouse: en táctil no hay hover y estorbaría al deslizar.
    if (e.pointerType !== "mouse" || reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    rotateY.set((x - 0.5) * 2 * TILT_MAX);
    rotateX.set((0.5 - y) * 2 * TILT_MAX);
    glareX.set(x * 100);
    glareY.set(y * 100);
    scale.set(HOVER_SCALE);
    glareOpacity.set(GLARE_OPACITY);
  };

  const handlePointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX, rotateY, scale, transformPerspective: PERSPECTIVE }}
      className={className}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glare, opacity: glareOpacity }}
      />
    </motion.div>
  );
}
