import type { CSSProperties } from "react";

// Mismos valores por defecto que el Gradual Blur de React Bits.
const DIV_COUNT = 5;
const STRENGTH = 2;

type Position = "top" | "bottom" | "left" | "right";

const DIRECTION: Record<Position, string> = {
  top: "to top",
  bottom: "to bottom",
  left: "to left",
  right: "to right",
};

type Props = {
  // Borde hacia el que crece el desenfoque.
  position: Position;
  // Blur exponencial: más fuerte cerca del borde.
  isExponential?: boolean;
  className?: string;
};

// Desenfoque progresivo en un borde: varias capas de backdrop-filter, cada una
// más borrosa y enmascarada a su franja, para que el contenido se difumine de
// a poco al acercarse al borde. El tamaño y la posición van por className.
export function GradualBlur({ position, isExponential = false, className }: Props) {
  const step = 100 / DIV_COUNT;

  const layers = Array.from({ length: DIV_COUNT }, (_, index) => {
    const i = index + 1;
    const progress = i / DIV_COUNT;
    const blurRem = isExponential
      ? 2 ** (progress * 4) * 0.0625 * STRENGTH
      : 0.0625 * (progress * DIV_COUNT + 1) * STRENGTH;

    // Franja de esta capa: aparece, se mantiene y se desvanece; las últimas
    // llegan hasta el borde.
    const stops = [`transparent ${step * i - step}%`, `black ${step * i}%`];
    if (step * i + step <= 100) stops.push(`black ${step * i + step}%`);
    if (step * i + step * 2 <= 100) stops.push(`transparent ${step * i + step * 2}%`);
    const mask = `linear-gradient(${DIRECTION[position]}, ${stops.join(", ")})`;

    const style: CSSProperties = {
      maskImage: mask,
      WebkitMaskImage: mask,
      backdropFilter: `blur(${blurRem.toFixed(3)}rem)`,
      WebkitBackdropFilter: `blur(${blurRem.toFixed(3)}rem)`,
    };
    return <div key={i} className="absolute inset-0" style={style} />;
  });

  return (
    <div aria-hidden className={`pointer-events-none ${className ?? ""}`}>
      {layers}
    </div>
  );
}
