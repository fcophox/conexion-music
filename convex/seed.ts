import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { albumValidator } from "./shared";

// Siembra inicial: solo escribe si la base está vacía (mismo comportamiento
// que tenía seedDatabase() contra Supabase).
export const seedIfEmpty = mutation({
  args: { albums: v.array(albumValidator) },
  handler: async (ctx, { albums }) => {
    const existing = await ctx.db.query("albums").first();
    if (existing) return { seeded: false };

    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      await ctx.db.insert("albums", {
        albumId: album.id,
        title: album.title,
        artist: album.artist,
        description: album.description,
        creator: album.creator,
        tracksCount: album.tracksCount,
        durationText: album.durationText,
        coverGradient: album.coverGradient,
        coverArtDesign: album.coverArtDesign,
        coverImage: album.coverImage,
        year: album.year,
        disabled: album.disabled ?? false,
        sortOrder: i,
      });

      for (let j = 0; j < album.tracks.length; j++) {
        const t = album.tracks[j];
        await ctx.db.insert("tracks", {
          trackId: t.id,
          albumId: album.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.duration,
          coverGradient: t.coverGradient,
          coverArtDesign: t.coverArtDesign,
          coverImage: t.coverImage,
          sortOrder: j,
        });
        await ctx.db.insert("trackStats", { trackId: t.id, plays: 0, likes: 0 });
      }
    }
    return { seeded: true };
  },
});
