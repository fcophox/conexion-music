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
});
