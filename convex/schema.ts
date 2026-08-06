import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Espejo del esquema que existía en Supabase (albums, tracks, track_stats,
// settings), en camelCase. Los ids "de negocio" (albumId string, trackId
// numérico) se conservan como campos indexados para no tocar el resto de la app.
export default defineSchema({
  albums: defineTable({
    albumId: v.string(),
    title: v.string(),
    artist: v.string(),
    description: v.string(),
    creator: v.string(),
    tracksCount: v.string(),
    durationText: v.string(),
    coverGradient: v.string(),
    coverArtDesign: v.string(),
    coverImage: v.optional(v.string()),
    year: v.number(),
    disabled: v.boolean(),
    aboutIntro: v.optional(v.string()),
    aboutDetails: v.optional(v.string()),
    // Preserva el orden de creación que en Supabase daba `created_at`.
    sortOrder: v.number(),
  }).index("by_albumId", ["albumId"]),

  tracks: defineTable({
    trackId: v.number(),
    albumId: v.string(),
    title: v.string(),
    artist: v.string(),
    album: v.string(),
    duration: v.number(),
    coverGradient: v.string(),
    coverArtDesign: v.string(),
    coverImage: v.optional(v.string()),
    // Imagen de fondo propia de la canción y letra. Ambas se editan desde el
    // panel de administración. La imagen vive en el storage de Convex:
    // bgImageStorageId es el archivo y bgImage su URL pública.
    bgImage: v.optional(v.string()),
    bgImageStorageId: v.optional(v.id("_storage")),
    lyrics: v.optional(v.string()),
    // Una pista deshabilitada no aparece en el playlist público; sí en el panel.
    disabled: v.optional(v.boolean()),
    sortOrder: v.number(),
  })
    .index("by_albumId", ["albumId"])
    .index("by_trackId", ["trackId"]),

  trackStats: defineTable({
    trackId: v.number(),
    plays: v.number(),
    likes: v.number(),
  }).index("by_trackId", ["trackId"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  marketplace: defineTable({
    name: v.string(),
    category: v.string(),
    price: v.number(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    sortOrder: v.number(),
  }),
});
