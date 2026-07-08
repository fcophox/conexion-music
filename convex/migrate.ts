import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Importación única desde Supabase. Es una internalMutation: no es invocable
// desde clientes, solo vía `npx convex run migrate:importAll '<json>'`.
// Reemplaza TODO el contenido de las cuatro tablas por el payload recibido.
export const importAll = internalMutation({
  args: {
    albums: v.array(
      v.object({
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
        sortOrder: v.number(),
      })
    ),
    tracks: v.array(
      v.object({
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
    ),
    trackStats: v.array(
      v.object({ trackId: v.number(), plays: v.number(), likes: v.number() })
    ),
    settings: v.array(v.object({ key: v.string(), value: v.string() })),
  },
  handler: async (ctx, args) => {
    for (const table of ["albums", "tracks", "trackStats", "settings"] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }

    for (const a of args.albums) await ctx.db.insert("albums", a);
    for (const t of args.tracks) await ctx.db.insert("tracks", t);
    for (const s of args.trackStats) await ctx.db.insert("trackStats", s);
    for (const s of args.settings) await ctx.db.insert("settings", s);

    return {
      albums: args.albums.length,
      tracks: args.tracks.length,
      trackStats: args.trackStats.length,
      settings: args.settings.length,
    };
  },
});
