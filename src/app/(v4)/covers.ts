import type { Album, Track } from "@/lib/catalog-types";

const DEFAULT_COVER = "/cd/cover_cover_conexion.png";

// Las carátulas guardadas con la ruta vieja /brand/ viven ahora en /cd/.
export function albumCover(album: Album) {
  return album.coverImage?.replace("/brand/", "/cd/") ?? DEFAULT_COVER;
}

// Imagen propia de la canción si se cargó desde el panel; si no, la del disco.
export function trackImage(track: Track, album: Album) {
  return track.bgImage ?? albumCover(album);
}
