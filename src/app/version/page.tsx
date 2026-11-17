import type { Metadata } from "next";
import Link from "next/link";

// Índice de las interfaces que conviven en el proyecto. Es una página interna
// para abrirlas y compararlas rápido, así que no va a los buscadores.
export const metadata: Metadata = {
  title: "Conexión — versiones",
  robots: { index: false, follow: false },
};

type Status = "actual" | "borrador" | "archivada";

type Version = {
  name: string;
  path: string;
  status: Status;
  description: string;
  // Direcciones internas de la versión (sus secciones), si tiene.
  sections?: { label: string; path: string }[];
};

const VERSIONS: Version[] = [
  {
    name: "v5",
    path: "/v5",
    status: "borrador",
    description:
      "Punto de partida de la siguiente interfaz. Todavía está vacía: solo existe la ruta.",
  },
  {
    name: "v4",
    path: "/",
    status: "actual",
    description:
      "La interfaz que ve el público. Vive en la raíz; las direcciones /v4/… que ya se compartieron redirigen aquí.",
    sections: [
      { label: "Playlist", path: "/playlist" },
      { label: "Discos", path: "/albums" },
      { label: "Experience", path: "/experience" },
    ],
  },
  {
    name: "Versión anterior",
    path: "/old-version",
    status: "archivada",
    description:
      "La home previa a la v4. Se conserva como referencia, fuera de los buscadores.",
  },
];

const STATUS_STYLES: Record<Status, string> = {
  actual: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  borrador: "bg-primary/15 text-primary ring-primary/30",
  archivada: "bg-muted text-muted-foreground ring-border",
};

export default function VersionsPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-2xl flex-col gap-10 animate-fade-in">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Versiones</h1>
          <p className="text-muted-foreground">
            Las interfaces que conviven hoy en el proyecto, con su dirección.
          </p>
        </header>

        <ul className="flex flex-col gap-4">
          {VERSIONS.map((version) => (
            <li
              key={version.path}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-medium">{version.name}</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[version.status]}`}
                >
                  {version.status}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {version.description}
              </p>

              <Link
                href={version.path}
                className="w-fit font-mono text-sm text-foreground underline underline-offset-4 transition-colors hover:text-emerald-400"
              >
                {version.path}
              </Link>

              {version.sections && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {version.sections.map((section) => (
                    <Link
                      key={section.path}
                      href={section.path}
                      className="rounded-lg bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-colors hover:bg-accent"
                    >
                      {section.label}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {section.path}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
