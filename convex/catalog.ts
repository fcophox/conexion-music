import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Devuelve el catálogo completo con la misma forma que el tipo Album de la app
// (id de negocio, tracks anidados y ordenados).
export const getCatalog = query({
  args: {},
  handler: async (ctx) => {
    const albums = await ctx.db.query("albums").collect();
    albums.sort((a, b) => a.sortOrder - b.sortOrder);

    return Promise.all(
      albums.map(async (a) => {
        const tracks = await ctx.db
          .query("tracks")
          .withIndex("by_albumId", (q) => q.eq("albumId", a.albumId))
          .collect();
        tracks.sort((t1, t2) => t1.sortOrder - t2.sortOrder);

        return {
          id: a.albumId,
          title: a.title,
          artist: a.artist,
          description: a.description,
          creator: a.creator,
          tracksCount: a.tracksCount,
          durationText: a.durationText,
          coverGradient: a.coverGradient,
          coverArtDesign: a.coverArtDesign,
          coverImage: a.coverImage,
          year: a.year,
          disabled: a.disabled,
          tracks: tracks.map((t) => ({
            id: t.trackId,
            title: t.title,
            artist: t.artist,
            album: t.album,
            duration: t.duration,
            coverGradient: t.coverGradient,
            coverArtDesign: t.coverArtDesign,
            coverImage: t.coverImage,
          })),
        };
      })
    );
  },
});

// Estadísticas de todas las pistas (plays y likes).
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("trackStats").collect();
    return stats.map((s) => ({ trackId: s.trackId, plays: s.plays, likes: s.likes }));
  },
});

// Las mutaciones de Convex son transaccionales: el leer-incrementar-escribir
// ya no tiene la condición de carrera que existía con Supabase.
export const incrementPlay = mutation({
  args: { trackId: v.number() },
  handler: async (ctx, { trackId }) => {
    const stat = await ctx.db
      .query("trackStats")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!stat) {
      await ctx.db.insert("trackStats", { trackId, plays: 1, likes: 0 });
      return 1;
    }
    await ctx.db.patch(stat._id, { plays: stat.plays + 1 });
    return stat.plays + 1;
  },
});

export const incrementLike = mutation({
  args: { trackId: v.number() },
  handler: async (ctx, { trackId }) => {
    const stat = await ctx.db
      .query("trackStats")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!stat) {
      await ctx.db.insert("trackStats", { trackId, plays: 0, likes: 1 });
      return 1;
    }
    await ctx.db.patch(stat._id, { likes: stat.likes + 1 });
    return stat.likes + 1;
  },
});

export const reorderTracks = mutation({
  args: { orderedTrackIds: v.array(v.number()) },
  handler: async (ctx, { orderedTrackIds }) => {
    for (let i = 0; i < orderedTrackIds.length; i++) {
      const track = await ctx.db
        .query("tracks")
        .withIndex("by_trackId", (q) => q.eq("trackId", orderedTrackIds[i]))
        .unique();
      if (track) await ctx.db.patch(track._id, { sortOrder: i });
    }
    return { ok: true as const };
  },
});

export const toggleAlbumStatus = mutation({
  args: { albumId: v.string(), disabled: v.boolean() },
  handler: async (ctx, { albumId, disabled }) => {
    const album = await ctx.db
      .query("albums")
      .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
      .unique();
    if (!album) return { ok: false as const, error: "Álbum no encontrado" };
    await ctx.db.patch(album._id, { disabled });
    return { ok: true as const };
  },
});
