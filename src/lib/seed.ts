import type { Album } from "./catalog-types";

// Datos semilla. Se escriben en data/catalog.json la primera vez que se lee el
// catálogo; a partir de ahí ese JSON es la fuente de verdad (editable desde /management).
export const SEED_ALBUMS: Album[] = [
  {
    id: "cero",
    title: "Cero",
    artist: "conexión",
    description: "Álbum de estudio debut. Un viaje a través de melodías alternativas y atmósferas envolventes.",
    creator: "conexión",
    tracksCount: "17 canciones",
    durationText: "67 min 43 seg",
    coverGradient: "from-zinc-800 to-black",
    coverArtDesign: "image",
    coverImage: "/cd/cover_cero_conexion.png",
    year: 2012,
    tracks: [
      { id: 101, title: "Papeles rotos", artist: "conexión", album: "Cero", duration: 250, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 102, title: "Cero", artist: "conexión", album: "Cero", duration: 208, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 103, title: "Amargo", artist: "conexión", album: "Cero", duration: 190, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 104, title: "Arráncame la piel", artist: "conexión", album: "Cero", duration: 264, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 105, title: "Dame tu mano", artist: "conexión", album: "Cero", duration: 217, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 106, title: "Dímelo", artist: "conexión", album: "Cero", duration: 218, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 107, title: "Ella", artist: "conexión", album: "Cero", duration: 234, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 108, title: "Hoy", artist: "conexión", album: "Cero", duration: 255, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 109, title: "Invierno", artist: "conexión", album: "Cero", duration: 282, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 110, title: "Me has enseñado", artist: "conexión", album: "Cero", duration: 284, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 111, title: "Noname", artist: "conexión", album: "Cero", duration: 225, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 112, title: "Para ti", artist: "conexión", album: "Cero", duration: 233, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 113, title: "Sin señal", artist: "conexión", album: "Cero", duration: 303, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 114, title: "Solo", artist: "conexión", album: "Cero", duration: 265, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 115, title: "Superhumano", artist: "conexión", album: "Cero", duration: 235, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 116, title: "Ya no estás", artist: "conexión", album: "Cero", duration: 247, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" },
      { id: 117, title: "Ya no importa", artist: "conexión", album: "Cero", duration: 153, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_cero_conexion.png" }
    ]
  },
  {
    id: "geminis",
    title: "Géminis",
    artist: "conexión",
    description: "Un viaje conceptual dual de conexión, explorando la dualidad de la mente y sonidos electroacústicos.",
    creator: "conexión",
    tracksCount: "11 canciones",
    durationText: "38 min 50 seg",
    coverGradient: "from-zinc-800 to-black",
    coverArtDesign: "image",
    coverImage: "/cd/cover_geminis_conexion.png",
    year: 2024,
    disabled: true,
    tracks: [
      { id: 301, title: "Imposibles", artist: "conexión", album: "Géminis", duration: 215, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 302, title: "Escapas", artist: "conexión", album: "Géminis", duration: 202, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 303, title: "Cae la noche", artist: "conexión", album: "Géminis", duration: 238, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 304, title: "Fallo original", artist: "conexión", album: "Géminis", duration: 195, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 305, title: "Insecto", artist: "conexión", album: "Géminis", duration: 188, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 306, title: "Ecos", artist: "conexión", album: "Géminis", duration: 210, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 307, title: "Géminis", artist: "conexión", album: "Géminis", duration: 224, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 308, title: "Un paso más", artist: "conexión", album: "Géminis", duration: 205, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 309, title: "Días grises", artist: "conexión", album: "Géminis", duration: 218, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 310, title: "Decreto", artist: "conexión", album: "Géminis", duration: 190, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" },
      { id: 311, title: "Tierra al sur", artist: "conexión", album: "Géminis", duration: 245, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_geminis_conexion.png" }
    ]
  },
  {
    id: "vertical",
    title: "Vertical",
    artist: "conexión",
    description: "Álbum conceptual de conexión. Un recorrido vertical a través de ritmos dinámicos y pasajes alternativos.",
    creator: "conexión",
    tracksCount: "5 canciones",
    durationText: "18 min 45 seg",
    coverGradient: "from-zinc-800 to-black",
    coverArtDesign: "image",
    coverImage: "/cd/cover_vertical_conexion.png",
    year: 2026,
    disabled: true,
    tracks: [
      { id: 201, title: "Ascensión", artist: "conexión", album: "Vertical", duration: 215, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_vertical_conexion.png" },
      { id: 202, title: "Gravedad", artist: "conexión", album: "Vertical", duration: 198, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_vertical_conexion.png" },
      { id: 203, title: "Punto de Quiebre", artist: "conexión", album: "Vertical", duration: 242, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_vertical_conexion.png" },
      { id: 204, title: "Caída Libre", artist: "conexión", album: "Vertical", duration: 220, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_vertical_conexion.png" },
      { id: 205, title: "Abismo", artist: "conexión", album: "Vertical", duration: 250, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_vertical_conexion.png" }
    ]
  },
  {
    id: "doble-cero",
    title: "Doble Cero",
    artist: "conexión",
    description: "El aclamado segundo trabajo de conexión, expandiendo las fronteras del rock alternativo y pop sintético.",
    creator: "conexión",
    tracksCount: "5 canciones",
    durationText: "18 min 45 seg",
    coverGradient: "from-zinc-800 to-black",
    coverArtDesign: "image",
    coverImage: "/cd/cover_doblecero_conexion.png",
    year: 2016,
    disabled: true,
    tracks: [
      { id: 401, title: "Frecuencia Cero", artist: "conexión", album: "Doble Cero", duration: 215, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_doblecero_conexion.png" },
      { id: 402, title: "Reflejo Inverso", artist: "conexión", album: "Doble Cero", duration: 198, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_doblecero_conexion.png" },
      { id: 403, title: "Líneas de Escape", artist: "conexión", album: "Doble Cero", duration: 242, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_doblecero_conexion.png" },
      { id: 404, title: "Eco Eterno", artist: "conexión", album: "Doble Cero", duration: 220, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_doblecero_conexion.png" },
      { id: 405, title: "Gravedad Cero", artist: "conexión", album: "Doble Cero", duration: 250, coverGradient: "from-zinc-800 to-black", coverArtDesign: "image", coverImage: "/cd/cover_doblecero_conexion.png" }
    ]
  }
];
