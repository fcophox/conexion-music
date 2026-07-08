import { v } from "convex/values";

// Validadores compartidos para el payload de seed/importación: la forma del
// tipo Album de la app (src/lib/catalog-types.ts) con tracks anidados.
export const trackValidator = v.object({
  id: v.number(),
  title: v.string(),
  artist: v.string(),
  album: v.string(),
  duration: v.number(),
  coverGradient: v.string(),
  coverArtDesign: v.string(),
  coverImage: v.optional(v.string()),
});

export const albumValidator = v.object({
  id: v.string(),
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
  disabled: v.optional(v.boolean()),
  tracks: v.array(trackValidator),
});
