import { SpecularButton } from "./SpecularButton";

export function HeroView() {
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

        <SpecularButton href="/">Iniciar</SpecularButton>
      </div>
    </section>
  );
}
