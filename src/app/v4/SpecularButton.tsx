"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

// Parámetros del Specular Button de React Bits (con sus valores por defecto).
const RADIUS = 18; // px
const BASE_COLOR = "#525252"; // borde fijo bajo el destello
const LINE_COLOR = "#ffffff"; // destello
const SHINE_SIZE = 10; // grados que ocupa cada destello en el borde
const SHINE_FADE = 40; // grados que tarda en desvanecerse a cada lado
const THICKNESS = 1; // px
const PROXIMITY = 250; // px desde los que el destello empieza a verse

// Dos destellos opuestos sobre el borde, centrados en el ángulo --sb-angle.
const HALF = SHINE_SIZE / 2;
const SHINE = `conic-gradient(from calc(var(--sb-angle, 0deg) - ${SHINE_FADE + HALF}deg), transparent 0deg, ${LINE_COLOR} ${SHINE_FADE}deg, ${LINE_COLOR} ${SHINE_FADE + SHINE_SIZE}deg, transparent ${SHINE_FADE * 2 + SHINE_SIZE}deg, transparent 180deg, ${LINE_COLOR} ${180 + SHINE_FADE}deg, ${LINE_COLOR} ${180 + SHINE_FADE + SHINE_SIZE}deg, transparent ${180 + SHINE_FADE * 2 + SHINE_SIZE}deg, transparent 360deg)`;
// Deja visible solo el anillo del borde (recorta el interior).
const RING_MASK = "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";

const shineStyle: CSSProperties = {
  padding: THICKNESS,
  background: SHINE,
  opacity: "var(--sb-shine, 0)",
  mask: RING_MASK,
  WebkitMask: RING_MASK,
  maskComposite: "exclude",
  WebkitMaskComposite: "xor",
};

type Props = {
  href: string;
  children: ReactNode;
};

// Botón de vidrio con borde especular: un destello recorre el borde apuntando
// al cursor y se enciende a medida que el mouse se acerca.
export function SpecularButton({ href, children }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame: number | null = null;
    let pointer = { x: 0, y: 0 };

    const update = () => {
      frame = null;
      const rect = el.getBoundingClientRect();
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);
      // En CSS, 0deg apunta hacia arriba y crece en sentido horario.
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      // Distancia al borde del botón (0 si el cursor está encima).
      const outsideX = Math.max(rect.left - pointer.x, 0, pointer.x - rect.right);
      const outsideY = Math.max(rect.top - pointer.y, 0, pointer.y - rect.bottom);
      const distance = Math.hypot(outsideX, outsideY);
      const shine = Math.max(0, 1 - distance / PROXIMITY);
      el.style.setProperty("--sb-angle", `${angle.toFixed(1)}deg`);
      el.style.setProperty("--sb-shine", shine.toFixed(3));
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      if (frame == null) frame = requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      style={{ borderRadius: RADIUS, boxShadow: `inset 0 0 0 ${THICKNESS}px ${BASE_COLOR}, inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.25)` }}
      className="relative inline-flex items-center justify-center px-10 py-[1.125rem] font-medium text-[#f5f5f5] transition-[scale,background-color] duration-200 hover:bg-white/[0.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
        style={shineStyle}
      />
      <span className="relative">{children}</span>
    </Link>
  );
}
