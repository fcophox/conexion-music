import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { V4Client } from "./V4Client";

export const metadata: Metadata = {
  title: "Conexión — v4",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Versión 4 de la interfaz: espacio aparte para iterar sin tocar la home actual.
export default async function V4Page() {
  // Igual que en la home: los discos y canciones deshabilitados no se muestran.
  const albums = (await getCatalog())
    .filter((album) => !album.disabled)
    .map((album) => ({
      ...album,
      tracks: album.tracks.filter((t) => !t.disabled),
    }));

  return <V4Client albums={albums} />;
}
