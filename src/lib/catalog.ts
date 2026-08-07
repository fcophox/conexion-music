import "server-only";
import { convex } from "./convex";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
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

export async function reorderAlbums(
  orderedAlbumIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await convex.mutation(api.catalog.reorderAlbums, { orderedAlbumIds });
    return res;
  } catch (error) {
    console.error("Convex reorderAlbums mutation error:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createAlbum(
  title: string,
  coverImage?: string,
  aboutIntro?: string,
  aboutDetails?: string
): Promise<{ ok: boolean; albumId?: string; error?: string }> {
  try {
    return await convex.mutation(api.catalog.createAlbum, { title, coverImage, aboutIntro, aboutDetails });
  } catch (error) {
    console.error("Convex createAlbum mutation error:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteAlbum(
  albumId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    return await convex.mutation(api.catalog.deleteAlbum, { albumId });
  } catch (error) {
    console.error("Convex deleteAlbum mutation error:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteTrack(
  trackId: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    return await convex.mutation(api.catalog.deleteTrack, { trackId });
  } catch (error) {
    console.error("Convex deleteTrack mutation error:", error);
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

export async function updateAlbumDetails(args: {
  albumId: string;
  title?: string;
  coverStorageId?: Id<"_storage">;
  year?: number;
  aboutIntro?: string;
  aboutDetails?: string;
}): Promise<{ ok: boolean; title?: string; coverImage?: string; year?: number; aboutIntro?: string; aboutDetails?: string; error?: string }> {
  try {
    const mutationArgs: any = { albumId: args.albumId };
    if (args.title !== undefined) mutationArgs.title = args.title;
    if (args.coverStorageId !== undefined) mutationArgs.coverStorageId = args.coverStorageId;
    if (args.year !== undefined) mutationArgs.year = args.year;
    if (args.aboutIntro !== undefined) mutationArgs.aboutIntro = args.aboutIntro;
    if (args.aboutDetails !== undefined) mutationArgs.aboutDetails = args.aboutDetails;

    return await convex.mutation(api.catalog.updateAlbumDetails, mutationArgs);
  } catch (error) {
    console.error("updateAlbumDetails error:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}


export async function toggleTrackStatus(
  trackId: number,
  disabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    return await convex.mutation(api.catalog.toggleTrackStatus, { trackId, disabled });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function moveTrackToAlbum(
  trackId: number,
  targetAlbumId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    return await convex.mutation(api.catalog.moveTrackToAlbum, { trackId, targetAlbumId });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function renameTrack(
  trackId: number,
  title: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    return await convex.mutation(api.catalog.renameTrack, { trackId, title });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getNextTrackId(): Promise<number> {
  try {
    return await convex.query(api.catalog.getNextTrackId, {});
  } catch (error) {
    console.error("getNextTrackId error:", error);
    return 501; // fallback alto para no colisionar
  }
}

export async function generateImageUploadUrl(): Promise<string | null> {
  try {
    return await convex.mutation(api.catalog.generateImageUploadUrl, {});
  } catch (error) {
    console.error("generateImageUploadUrl error:", error);
    return null;
  }
}

export async function updateTrackDetails(details: {
  trackId: number;
  bgImageStorageId?: string;
  removeImage?: boolean;
  lyrics?: string;
}): Promise<{ ok: boolean; bgImage?: string; error?: string }> {
  try {
    return await convex.mutation(api.catalog.updateTrackDetails, {
      trackId: details.trackId,
      bgImageStorageId: details.bgImageStorageId as Id<"_storage"> | undefined,
      removeImage: details.removeImage,
      lyrics: details.lyrics,
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function addTrack(track: {
  trackId: number;
  albumId: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverGradient: string;
  coverArtDesign: string;
  coverImage?: string;
  sortOrder: number;
}): Promise<{ ok: boolean; trackId?: number; error?: string }> {
  try {
    return await convex.mutation(api.catalog.addTrack, track);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function seedMarketplaceIfEmpty() {
  try {
    await convex.mutation(api.catalog.seedMarketplaceIfEmpty, {});
  } catch (error) {
    console.error("Error seeding Convex marketplace database:", error);
  }
}

export async function getMarketplaceProducts() {
  await seedMarketplaceIfEmpty();
  try {
    return await convex.query(api.catalog.getMarketplaceProducts, {});
  } catch (error) {
    console.error("Error fetching marketplace products from Convex:", error);
    return [];
  }
}

export async function createMarketplaceProduct(product: {
  name: string;
  category: string;
  price: number;
  description?: string;
  imageStorageId?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    return await convex.mutation(api.catalog.addMarketplaceProduct, product);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteMarketplaceProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    return await convex.mutation(api.catalog.deleteMarketplaceProduct, { id });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
