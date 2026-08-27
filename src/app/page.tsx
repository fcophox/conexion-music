import { Suspense } from "react";
import HomeClient from "./HomeClient";
import { getCatalogWithStats, getMarketplaceProducts, getCarouselSlides } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Page() {
  // Las canciones deshabilitadas desde el panel no llegan al playlist público.
  // El conteo y la duración del disco se calculan con las canciones visibles
  // (los campos tracksCount/durationText de la base quedan como respaldo).
  const [albums, marketplaceProducts, carouselSlides] = await Promise.all([
    getCatalogWithStats().then((list) =>
      list.map((album) => {
        const tracks = album.tracks.filter((t) => !t.disabled);
        const totalSeconds = tracks.reduce((sum, t) => sum + t.duration, 0);
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.round(totalSeconds % 60);
        return {
          ...album,
          tracks,
          tracksCount: `${tracks.length} ${tracks.length === 1 ? "canción" : "canciones"}`,
          durationText: secs > 0 ? `${mins} min ${secs} seg` : `${mins} min`,
        };
      })
    ),
    getMarketplaceProducts(),
    getCarouselSlides(),
  ]);

  return (
    <Suspense fallback={<div className="h-screen w-full bg-zinc-950 flex items-center justify-center text-zinc-500">Cargando...</div>}>
      <HomeClient albums={albums} initialProducts={marketplaceProducts} carouselSlides={carouselSlides} />
    </Suspense>
  );
}
