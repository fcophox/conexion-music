import { sectionPath } from "./sections";
import { SpecularButton } from "./SpecularButton";

type Props = {
  // Abre la Playlist sin recargar la página (así no se corta la música).
  onStart: () => void;
};

export function HeroView({ onStart }: Props) {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="relative flex max-w-xl flex-col items-center gap-8 animate-fade-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/conexionlogo.svg"
          alt="Conexión"
          className="h-12 w-auto sm:h-16"
        />

        <p className="text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Escucha la discografía completa de conexión. Explora sus álbumes,
          letras y música alternativa en un solo lugar.
        </p>

        <SpecularButton href={sectionPath("music")} onNavigate={onStart}>
          Iniciar
        </SpecularButton>
      </div>
    </section>
  );
}
