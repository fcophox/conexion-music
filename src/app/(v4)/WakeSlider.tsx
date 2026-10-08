"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";

// Parámetros del Wake Slider de React Bits (con sus valores por defecto).
const SENSITIVITY = 1; // qué tan fácil la velocidad levanta la estela
const REACH = 6; // medio ancho de la estela a toda velocidad, en barras
const SKEW = 0.6; // cuánto más larga es la estela detrás del control
const GLIDE = 0.3; // segundos que tarda el control en asentarse
const SMOOTHING = 100; // ms de retardo de la velocidad
// Velocidad (barras por segundo) a la que la estela llega a su altura máxima.
const FULL_SPEED = 60;

type Props = {
  // Valor entre 0 y 100.
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  bars?: number;
  // Altura máxima de una barra (techo de la estela) y altura en reposo, en px.
  height?: number;
  restHeight?: number;
  className?: string;
};

// Control deslizante dibujado con barras: las de la izquierda quedan encendidas
// hasta el valor, y al moverlo rápido las barras cercanas se levantan como una
// estela, más larga por detrás del movimiento.
export function WakeSlider({
  value,
  onChange,
  ariaLabel,
  bars = 28,
  height = 28,
  restHeight = 8,
  className,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const frameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  // Posición mostrada (0–1): persigue al valor con un pequeño deslizamiento.
  const positionRef = useRef(value / 100);
  const targetRef = useRef(value / 100);
  const velocityRef = useRef(0);

  // Pinta las barras según la posición y la velocidad actuales.
  const paint = () => {
    const position = positionRef.current;
    const velocity = velocityRef.current;
    const intensity = Math.min(1, (Math.abs(velocity) / FULL_SPEED) * SENSITIVITY);
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const center = (i + 0.5) / bars;
      const distance = (center - position) * bars;
      // "Detrás" es el lado desde el que viene el control.
      const isBehind = Math.sign(distance) !== Math.sign(velocity);
      const width = REACH * (isBehind ? 1 + SKEW : 1 - SKEW);
      const falloff = Math.max(0, 1 - Math.abs(distance) / width);
      const lift = intensity * falloff * falloff * (3 - 2 * falloff);
      const barHeight = restHeight + (height - restHeight) * lift;
      // Altura real (no scaleY) para que las puntas redondas no se deformen.
      bar.style.height = `${barHeight}px`;
      bar.style.opacity = center <= position ? "1" : "0.25";
    });
  };

  const stop = () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  const start = () => {
    if (frameRef.current != null) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      positionRef.current = targetRef.current;
      velocityRef.current = 0;
      paint();
      return;
    }
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;
      const previous = positionRef.current;
      // El control se desliza hacia el valor y la velocidad se suaviza.
      const glide = 1 - Math.exp(-dt / (GLIDE / 4));
      positionRef.current = previous + (targetRef.current - previous) * glide;
      const rawVelocity = ((positionRef.current - previous) * bars) / dt;
      const smooth = 1 - Math.exp(-dt / (SMOOTHING / 1000));
      velocityRef.current += (rawVelocity - velocityRef.current) * smooth;
      paint();

      const isSettled =
        Math.abs(targetRef.current - positionRef.current) < 0.0005 &&
        Math.abs(velocityRef.current) < 0.05;
      if (isSettled) {
        positionRef.current = targetRef.current;
        velocityRef.current = 0;
        paint();
        frameRef.current = null;
        return;
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  };

  // Sigue al valor cuando cambia (por el puntero, el teclado o desde fuera).
  useEffect(() => {
    targetRef.current = value / 100;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    paint();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valueAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return value;
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(fraction * 100);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    onChange(valueAt(e.clientX));
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) onChange(valueAt(e.clientX));
  };

  const handlePointerEnd = () => {
    isDraggingRef.current = false;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = {
      ArrowRight: 5,
      ArrowUp: 5,
      ArrowLeft: -5,
      ArrowDown: -5,
      Home: -100,
      End: 100,
    };
    const delta = steps[e.key];
    if (delta == null) return;
    e.preventDefault();
    onChange(Math.min(100, Math.max(0, value + delta)));
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
      style={{ height }}
      className={`flex cursor-pointer touch-none items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          style={{ height: restHeight }}
          className="min-w-0 flex-1 rounded-full bg-white"
        />
      ))}
    </div>
  );
}
