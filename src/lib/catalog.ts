import "server-only";
import { supabase } from "./supabase";
import type { Album, AlbumWithStats, Track } from "./catalog-types";
import { SEED_ALBUMS } from "./seed";

// Inicializa la base de datos de Supabase si está vacía
export async function seedDatabase() {
  const { count } = await supabase.from("albums").select("*", { count: "exact", head: true });
  if (count && count > 0) return;

  for (const album of SEED_ALBUMS) {
    await supabase.from("albums").insert({
      id: album.id,
      title: album.title,
      artist: album.artist,
      description: album.description,
      creator: album.creator,
      tracks_count: album.tracksCount,
      duration_text: album.durationText,
      cover_gradient: album.coverGradient,
      cover_art_design: album.coverArtDesign,
      cover_image: album.coverImage,
      year: album.year,
      disabled: album.disabled ?? false,
    });

    const tracks = album.tracks.map((t, index) => ({
      id: t.id,
      album_id: album.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      cover_gradient: t.coverGradient,
      cover_art_design: t.coverArtDesign,
      cover_image: t.coverImage,
      sort_order: index,
    }));
    await supabase.from("tracks").insert(tracks);

    const trackStats = album.tracks.map(t => ({
      track_id: t.id,
      plays: 0,
      likes: 0
    }));
    await supabase.from("track_stats").insert(trackStats);
  }
}

export async function getCatalog(): Promise<Album[]> {
  await seedDatabase();

  const { data: albumsData, error } = await supabase
    .from("albums")
    .select("*, tracks(*)")
    .order("created_at", { ascending: true });

  if (error || !albumsData) {
    console.error("Error fetching catalog from Supabase:", error);
    return [];
  }

  return albumsData.map((a: any) => {
    const sortedTracks = (a.tracks || []).sort((t1: any, t2: any) => t1.sort_order - t2.sort_order);

    return {
      id: a.id,
      title: a.title,
      artist: a.artist,
      description: a.description,
      creator: a.creator,
      tracksCount: a.tracks_count,
      durationText: a.duration_text,
      coverGradient: a.cover_gradient,
      coverArtDesign: a.cover_art_design,
      coverImage: a.cover_image,
      year: a.year,
      disabled: a.disabled,
      tracks: sortedTracks.map((t: any) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        coverGradient: t.cover_gradient,
        coverArtDesign: t.cover_art_design,
        coverImage: t.cover_image,
      }))
    };
  });
}

export async function getPlays(): Promise<Record<string, number>> {
  const { data } = await supabase.from("track_stats").select("track_id, plays");
  const plays: Record<string, number> = {};
  if (data) {
    data.forEach(d => {
      plays[d.track_id] = d.plays;
    });
  }
  return plays;
}

export async function getLikes(): Promise<Record<string, number>> {
  const { data } = await supabase.from("track_stats").select("track_id, likes");
  const likes: Record<string, number> = {};
  if (data) {
    data.forEach(d => {
      likes[d.track_id] = d.likes;
    });
  }
  return likes;
}

export async function incrementPlay(trackId: number): Promise<number> {
  const { data: current } = await supabase.from("track_stats").select("plays").eq("track_id", trackId).single();
  const next = (current?.plays || 0) + 1;
  await supabase.from("track_stats").update({ plays: next }).eq("track_id", trackId);
  return next;
}

export async function incrementLike(trackId: number): Promise<number> {
  const { data: current } = await supabase.from("track_stats").select("likes").eq("track_id", trackId).single();
  const next = (current?.likes || 0) + 1;
  await supabase.from("track_stats").update({ likes: next }).eq("track_id", trackId);
  return next;
}

export async function getCatalogWithStats(): Promise<AlbumWithStats[]> {
  const [albums, plays, likes] = await Promise.all([getCatalog(), getPlays(), getLikes()]);
  return albums.map((album) => ({
    ...album,
    tracks: album.tracks.map((t) => ({
      ...t,
      plays: plays[t.id] ?? 0,
      likes: likes[t.id] ?? 0
    })),
  }));
}

export async function reorderAlbumTracks(
  albumId: string,
  orderedTrackIds: number[]
): Promise<{ ok: boolean; error?: string }> {
  for (let i = 0; i < orderedTrackIds.length; i++) {
    await supabase.from("tracks").update({ sort_order: i }).eq("id", orderedTrackIds[i]);
  }
  return { ok: true };
}

export async function toggleAlbumStatus(
  albumId: string,
  disabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("albums").update({ disabled }).eq("id", albumId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
