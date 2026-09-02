"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

export interface CoverFlowItem {
  id: string;
  title: string;
  image: string;
  link: string;
  subtitle?: string;
  disabled?: boolean;
}

interface AppleCoverFlowProps {
  items: CoverFlowItem[];
  onOpen?: (item: CoverFlowItem) => void;
  onActiveChange?: (item: CoverFlowItem | null) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function AppleCoverFlow({
  items,
  onOpen,
  onActiveChange,
}: AppleCoverFlowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [spacing, setSpacing] = useState(146);
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(false);
  const dragX = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const safeActiveIndex = clamp(activeIndex, 0, Math.max(0, items.length - 1));
  const activeItem = items[safeActiveIndex] ?? null;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(([entry]) => {
      setSpacing(clamp(entry.contentRect.width * 0.235, 142, 330));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const select = (index: number) => {
    const nextIndex = clamp(index, 0, items.length - 1);
    setActiveIndex(nextIndex);
    onActiveChange?.(items[nextIndex] ?? null);
  };

  const openActive = () => {
    if (!activeItem || activeItem.disabled) return;
    if (onOpen) onOpen(activeItem);
    else window.location.assign(activeItem.link);
  };

  const handleWheel = (event: React.WheelEvent) => {
    const movement = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
    if (Math.abs(movement) < 8 || wheelLock.current) return;

    event.preventDefault();
    wheelLock.current = true;
    select(safeActiveIndex + (movement > 0 ? 1 : -1));
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 220);
  };

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Discografía"
      aria-roledescription="carrusel"
      className="relative w-full overflow-visible"
    >
      <motion.div
        ref={stageRef}
        tabIndex={0}
        role="group"
        aria-label={`${activeItem?.title ?? "Disco"}, ${safeActiveIndex + 1} de ${items.length}`}
        className="relative h-[310px] outline-none cursor-grab active:cursor-grabbing touch-pan-y rounded-3xl md:h-[clamp(430px,38vw,570px)]"
        style={{ perspective: "1200px", x: dragX }}
        drag={reduceMotion ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onWheel={handleWheel}
        onDragEnd={(_, info) => {
          const projected = info.offset.x + info.velocity.x * 0.18;
          const isIntentional = Math.abs(projected) > 36;
          const steps = isIntentional
            ? clamp(Math.round(Math.abs(projected) / spacing), 1, 2)
            : 0;
          select(safeActiveIndex + (projected < 0 ? steps : -steps));
          animate(dragX, 0, {
            type: "spring",
            duration: 0.4,
            bounce: isIntentional ? 0.2 : 0,
            velocity: info.velocity.x,
          });
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            select(safeActiveIndex + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            select(safeActiveIndex - 1);
          } else if (event.key === "Home") {
            event.preventDefault();
            select(0);
          } else if (event.key === "End") {
            event.preventDefault();
            select(items.length - 1);
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openActive();
          }
        }}
      >
        <div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((item, index) => {
            const relative = index - safeActiveIndex;
            const distance = Math.abs(relative);
            const isActive = relative === 0;
            const rotateY = reduceMotion ? 0 : relative === 0 ? 0 : relative > 0 ? -56 : 56;
            const translateX = relative * spacing;
            const translateZ = reduceMotion ? 0 : -Math.min(distance, 4) * 105;
            const opacity = distance > 4 ? 0 : Math.max(0.28, 1 - distance * 0.16);
            const scale = reduceMotion ? (isActive ? 1 : 0.88) : isActive ? 1 : 0.86;

            return (
              <motion.button
                type="button"
                key={item.id}
                aria-label={`${isActive ? "Abrir" : "Seleccionar"} ${item.title}`}
                aria-current={isActive ? "true" : undefined}
                disabled={item.disabled && isActive}
                onPointerEnter={() => onActiveChange?.(item)}
                onPointerLeave={() => onActiveChange?.(activeItem)}
                onClick={() => {
                  if (!isActive) select(index);
                  else openActive();
                }}
                initial={false}
                animate={{
                  transform: `translate3d(calc(-50% + ${translateX}px), 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex: items.length - distance,
                }}
                transition={reduceMotion
                  ? { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
                  : { type: "spring", duration: 0.4, bounce: 0 }}
                className={`absolute left-1/2 top-4 w-[clamp(156px,40vw,246px)] text-left outline-none [transform-style:preserve-3d] will-change-transform md:w-[clamp(246px,22vw,340px)] ${item.disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                style={{ transformOrigin: relative < 0 ? "right center" : "left center" }}
              >
                <span className="relative block aspect-square overflow-hidden rounded-[clamp(0.75rem,2vw,1.25rem)] bg-zinc-900 shadow-[0_24px_55px_rgba(0,0,0,0.55)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={`Carátula de ${item.title}`}
                    draggable={false}
                    className="h-full w-full object-cover select-none"
                  />
                  {item.disabled && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <span className="rounded-full bg-[#FFC107]/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black shadow-lg">
                        Pronto
                      </span>
                    </span>
                  )}
                </span>

                {!reduceMotion && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-[calc(100%+6px)] block h-[58%] w-full overflow-hidden rounded-[clamp(0.75rem,2vw,1.25rem)] opacity-30"
                    style={{
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,.72), transparent 62%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.72), transparent 62%)",
                      transform: "scaleY(-1)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover blur-[0.4px]"
                    />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <div className="relative z-30 -mt-20 flex min-h-20 flex-col items-center text-center md:-mt-36 xl:-mt-40" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {activeItem && (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, transform: "translateY(8px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={{ opacity: 0, transform: "translateY(-8px)" }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <h3 className={`text-base font-bold tracking-[-0.01em] sm:text-lg ${activeItem.disabled ? "text-zinc-500" : "text-white"}`}>
                {activeItem.title}
              </h3>
              {activeItem.subtitle && (
                <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{activeItem.subtitle}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {items.map((item, index) => (
            <span
              key={item.id}
              className={`h-1 rounded-full transition-[width,background-color] duration-200 ${index === safeActiveIndex ? "w-5 bg-[#FFC107]" : "w-1 bg-zinc-700"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
