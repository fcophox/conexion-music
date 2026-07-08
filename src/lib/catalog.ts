import "server-only";
import { convex } from "./convex";
import { api } from "../../convex/_generated/api";
import type { Album, AlbumWithStats } from "./catalog-types";
import { SEED_ALBUMS } from "./seed";

// Siembra la base de Convex si está vacía (la mutación no hace nada si ya hay datos).
export async function seedDatabase() {
  try {
    await convex.mutation(api.seed.seedIfEmpty, { albums: SEED_ALBUMS });
  } catch (error) {
    console.error("Error seeding Convex database:", error);
  }
}

export async function getCatalog(): Promise<Album[]> {
  await seedDatabase();
  try {
    const albums = await convex.query(api.catalog.getCatalog, {});
    return albums as unknown as Album[];
  } catch (error) {
    console.error("Error fetching catalog from Convex:", error);
    return [];
  }
}

async function getStats(): Promise<{ plays: Record<string, number>; likes: Record<string, number> }> {
  const plays: Record<string, number> = {};
  const likes: Record<string, number> = {};
  try {
    const stats = await convex.query(api.catalog.getStats, {});
    for (const s of stats) {
      plays[s.trackId] = s.plays;
      likes[s.trackId] = s.likes;
    }
  } catch (error) {
    console.error("Error fetching stats from Convex:", error);
  }
  return { plays, likes };
}

export async function getPlays(): Promise<Record<string, number>> {
  return (await getStats()).plays;
}

export async function getLikes(): Promise<Record<string, number>> {
  return (await getStats()).likes;
}

export async function incrementPlay(trackId: number): Promise<number> {
  try {
    return await convex.mutation(api.catalog.incrementPlay, { trackId });
  } catch (error) {
    console.error("incrementPlay error:", error);
    return 0;
  }
}

export async function incrementLike(trackId: number): Promise<number> {
  try {
    return await convex.mutation(api.catalog.incrementLike, { trackId });
  } catch (error) {
    console.error("incrementLike error:", error);
    return 0;
  }
}

export async function getCatalogWithStats(): Promise<AlbumWithStats[]> {
  const [albums, stats] = await Promise.all([getCatalog(), getStats()]);
  return albums.map((album) => ({
    ...album,
    tracks: album.tracks.map((t) => ({
      ...t,
      plays: stats.plays[t.id] ?? 0,
      likes: stats.likes[t.id] ?? 0,
    })),
  }));
}

export async function reorderAlbumTracks(
  albumId: string,
  orderedTrackIds: number[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    return await convex.mutation(api.catalog.reorderTracks, { orderedTrackIds });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function toggleAlbumStatus(
  albumId: string,
  disabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    return await convex.mutation(api.catalog.toggleAlbumStatus, { albumId, disabled });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
