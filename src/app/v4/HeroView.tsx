import Link from "next/link";

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

        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-500 px-10 font-semibold text-zinc-950 transition-[transform,background-color] duration-150 hover:bg-emerald-400 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Iniciar
        </Link>
      </div>
    </section>
  );
}
