import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { V4Client } from "../V4Client";
import { sectionDocumentTitle, sectionFromSlug } from "../sections";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

// Una sola página para /v4 y sus secciones (/v4/playlist, /v4/albums, …): así
// el reproductor no se desmonta al cambiar de sección. Devuelve la sección de
// la dirección, o null si la dirección no existe.
async function resolveSection({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length > 1) return null;
  return sectionFromSlug(slug[0] ?? "");
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const section = await resolveSection(props);
  return {
    title: sectionDocumentTitle(section ?? "home"),
    robots: { index: false, follow: false },
  };
}

// Versión 4 de la interfaz: espacio aparte para iterar sin tocar la home actual.
export default async function V4Page(props: Props) {
  if (!(await resolveSection(props))) notFound();

  // Igual que en la home: los discos y canciones deshabilitados no se muestran.
  const albums = (await getCatalog())
    .filter((album) => !album.disabled)
    .map((album) => ({
      ...album,
      tracks: album.tracks.filter((t) => !t.disabled),
    }));

  return <V4Client albums={albums} />;
}
