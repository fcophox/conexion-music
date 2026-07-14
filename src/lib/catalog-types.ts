// Tipos compartidos del catálogo. Sin dependencias de servidor (fs), para poder
// importarlos tanto desde componentes cliente como desde el código de servidor.

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number; // en segundos
  coverGradient: string;
  coverArtDesign: "circle" | "retro" | "wave" | "neon" | "sunset" | "image";
  coverImage?: string;
  // Imagen de fondo propia de la canción; si falta, la vista usa la carátula
  // del disco. La letra también es opcional (hay letras por defecto en el home).
  bgImage?: string;
  lyrics?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  description: string;
  creator: string;
  tracksCount: string;
  durationText: string;
  coverGradient: string;
  coverArtDesign: "circle" | "retro" | "wave" | "neon" | "sunset" | "discover" | "image";
  coverImage?: string;
  year: number;
  disabled?: boolean;
  tracks: Track[];
}

// Álbum con estadísticas para el panel de administración.
export interface TrackWithStats extends Track {
  plays: number;
  likes: number;
}

export interface AlbumWithStats extends Omit<Album, "tracks"> {
  tracks: TrackWithStats[];
}
