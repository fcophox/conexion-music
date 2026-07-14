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
            bgImage: t.bgImage,
            lyrics: t.lyrics,
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

export const moveTrackToAlbum = mutation({
  args: { trackId: v.number(), targetAlbumId: v.string() },
  handler: async (ctx, { trackId, targetAlbumId }) => {
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!track) return { ok: false as const, error: "Canción no encontrada" };

    const targetAlbum = await ctx.db
      .query("albums")
      .withIndex("by_albumId", (q) => q.eq("albumId", targetAlbumId))
      .unique();
    if (!targetAlbum) return { ok: false as const, error: "Álbum destino no encontrado" };

    const targetTracks = await ctx.db
      .query("tracks")
      .withIndex("by_albumId", (q) => q.eq("albumId", targetAlbumId))
      .collect();
    const maxSortOrder = targetTracks.length > 0
      ? Math.max(...targetTracks.map((t) => t.sortOrder))
      : 0;

    await ctx.db.patch(track._id, {
      albumId: targetAlbumId,
      album: targetAlbum.title,
      sortOrder: maxSortOrder + 1,
    });

    return { ok: true as const };
  },
});

export const getNextTrackId = query({
  args: {},
  handler: async (ctx) => {
    const tracks = await ctx.db.query("tracks").collect();
    if (tracks.length === 0) return 101;
    const maxId = Math.max(...tracks.map((t) => t.trackId));
    return maxId + 1;
  },
});

export const addTrack = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tracks", {
      trackId: args.trackId,
      albumId: args.albumId,
      title: args.title,
      artist: args.artist,
      album: args.album,
      duration: args.duration,
      coverGradient: args.coverGradient,
      coverArtDesign: args.coverArtDesign,
      coverImage: args.coverImage,
      sortOrder: args.sortOrder,
    });
    await ctx.db.insert("trackStats", {
      trackId: args.trackId,
      plays: 0,
      likes: 0,
    });
    return { ok: true as const, trackId: args.trackId };
  },
});

export const renameTrack = mutation({
  args: { trackId: v.number(), title: v.string() },
  handler: async (ctx, { trackId, title }) => {
    const clean = title.trim();
    if (!clean || clean.length > 120) {
      return { ok: false as const, error: "Título inválido (1–120 caracteres)" };
    }
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!track) return { ok: false as const, error: "Canción no encontrada" };
    await ctx.db.patch(track._id, { title: clean });
    return { ok: true as const };
  },
});

// Actualiza la imagen de fondo y/o la letra de una canción. Solo modifica los
// campos presentes en los argumentos; una cadena vacía elimina el valor.
export const updateTrackDetails = mutation({
  args: {
    trackId: v.number(),
    bgImage: v.optional(v.string()),
    lyrics: v.optional(v.string()),
  },
  handler: async (ctx, { trackId, bgImage, lyrics }) => {
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!track) return { ok: false as const, error: "Canción no encontrada" };

    const patch: { bgImage?: string | undefined; lyrics?: string | undefined } = {};
    if (bgImage !== undefined) patch.bgImage = bgImage === "" ? undefined : bgImage;
    if (lyrics !== undefined) patch.lyrics = lyrics === "" ? undefined : lyrics;
    await ctx.db.patch(track._id, patch);
    return { ok: true as const };
  },
});

export const deleteAlbumTracks = mutation({
  args: { albumId: v.string() },
  handler: async (ctx, { albumId }) => {
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
      .collect();

    for (const track of tracks) {
      // Borrar stats asociadas
      const stat = await ctx.db
        .query("trackStats")
        .withIndex("by_trackId", (q) => q.eq("trackId", track.trackId))
        .unique();
      if (stat) await ctx.db.delete(stat._id);
      // Borrar la pista
      await ctx.db.delete(track._id);
    }

    return { ok: true as const, deleted: tracks.length };
  },
});
