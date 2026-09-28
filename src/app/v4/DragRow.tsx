"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
} from "react";

// Distancia mínima (px) para que un clic se considere arrastre.
const DRAG_THRESHOLD = 5;
// Fricción de la inercia al soltar (por frame, ~60fps).
const FRICTION = 0.94;
// Velocidad máxima de la inercia (px/ms) y pausa tras la cual se anula.
const MAX_VELOCITY = 2.5;
const IDLE_MS = 80;

type DragState = {
  startX: number;
  startScroll: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  isMoved: boolean;
};

type Props = {
  children: ReactNode;
};

// Fila horizontal: se arrastra con el mouse (con inercia), se mueve con la
// rueda y muestra un degradado a la derecha mientras quede contenido por ver.
// Los hijos deben ser <li>.
export function DragRow({ children }: Props) {
  const dragRef = useRef<DragState | null>(null);
  const momentumRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const stopMomentum = () => {
    if (momentumRef.current != null) cancelAnimationFrame(momentumRef.current);
    momentumRef.current = null;
  };

  useEffect(() => stopMomentum, []);

  // Degradado a la derecha solo mientras queden tarjetas por ver.
  const listRef = useRef<HTMLUListElement>(null);
  const [hasMoreRight, setHasMoreRight] = useState(false);

  const updateOverflow = () => {
    const el = listRef.current;
    if (!el) return;
    setHasMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setHasMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Con rueda vertical (mouse sin scroll horizontal) desplaza la fila de lado.
  const handleWheel = (e: WheelEvent<HTMLUListElement>) => {
    stopMomentum();
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // Arrastre con el mouse (en táctil ya funciona el scroll nativo).
  const handlePointerDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    stopMomentum();
    dragRef.current = {
      startX: e.clientX,
      startScroll: e.currentTarget.scrollLeft,
      lastX: e.clientX,
      lastTime: e.timeStamp,
      velocity: 0,
      isMoved: false,
    };
  };

  const handlePointerMove = (e: PointerEvent<HTMLUListElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (!drag.isMoved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      drag.isMoved = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const dt = e.timeStamp - drag.lastTime;
    if (dt > 0) drag.velocity = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastTime = e.timeStamp;
    e.currentTarget.scrollLeft = drag.startScroll - dx;
  };

  const handlePointerUp = (e: PointerEvent<HTMLUListElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.isMoved) {
      dragRef.current = null;
      return;
    }
    setIsDragging(false);

    // Inercia: sigue deslizando con la velocidad del último movimiento.
    const el = e.currentTarget;
    const isIdle = e.timeStamp - drag.lastTime > IDLE_MS;
    const clamped = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, drag.velocity));
    let velocity = isIdle ? 0 : clamped * 16; // px por frame
    const step = () => {
      velocity *= FRICTION;
      if (Math.abs(velocity) < 0.5) {
        momentumRef.current = null;
        return;
      }
      el.scrollLeft -= velocity;
      momentumRef.current = requestAnimationFrame(step);
    };
    momentumRef.current = requestAnimationFrame(step);
  };

  // Si hubo arrastre, el clic final no debe activar la tarjeta.
  const handleClickCapture = (e: MouseEvent<HTMLUListElement>) => {
    if (dragRef.current?.isMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
    dragRef.current = null;
  };

  const cursorClass = isDragging
    ? "cursor-grabbing [&_*]:cursor-grabbing"
    : "cursor-grab [&_button]:cursor-grab";

  return (
    <div className="relative w-full">
      <ul
        ref={listRef}
        onScroll={updateOverflow}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        className={`no-scrollbar flex w-full select-none gap-5 overflow-x-auto pb-4 pl-24 pr-10 sm:pl-32 ${cursorClass}`}
      >
        {children}
      </ul>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background via-background/70 to-transparent transition-opacity duration-300 sm:w-56 ${hasMoreRight ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
