// Exporta albums/tracks/track_stats/settings de Supabase y genera el payload
// para la mutación interna migrate:importAll de Convex.
//
// Uso:
//   node scripts/migrate-supabase-to-convex.mjs > payload.json
//   npx convex run migrate:importAll "$(cat payload.json)"
//
// Lee NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY de .env.local.

import { readFileSync } from "fs";
import path from "path";

const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan credenciales de Supabase en .env.local");
  process.exit(1);
}

async function fetchTable(table, order) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*${order ? `&order=${order}` : ""}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Error leyendo ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

const [albums, tracks, trackStats, settings] = await Promise.all([
  fetchTable("albums", "created_at.asc"),
  fetchTable("tracks", "sort_order.asc"),
  fetchTable("track_stats"),
  fetchTable("settings"),
]);

const omitNull = (value) => (value === null || value === undefined ? undefined : value);

const payload = {
  albums: albums.map((a, i) => ({
    albumId: a.id,
    title: a.title,
    artist: a.artist,
    description: a.description,
    creator: a.creator,
    tracksCount: String(a.tracks_count),
    durationText: a.duration_text,
    coverGradient: a.cover_gradient,
    coverArtDesign: a.cover_art_design,
    coverImage: omitNull(a.cover_image),
    year: Number(a.year),
    disabled: Boolean(a.disabled),
    sortOrder: i,
  })),
  tracks: tracks.map((t) => ({
    trackId: Number(t.id),
    albumId: t.album_id,
    title: t.title,
    artist: t.artist,
    album: t.album,
    duration: Number(t.duration),
    coverGradient: t.cover_gradient,
    coverArtDesign: t.cover_art_design,
    coverImage: omitNull(t.cover_image),
    sortOrder: Number(t.sort_order),
  })),
  trackStats: trackStats.map((s) => ({
    trackId: Number(s.track_id),
    plays: Number(s.plays ?? 0),
    likes: Number(s.likes ?? 0),
  })),
  settings: settings.map((s) => ({ key: s.id, value: s.value })),
};

// JSON.stringify omite las claves con valor undefined (coverImage null).
console.log(JSON.stringify(payload));
console.error(
  `Exportado: ${payload.albums.length} álbumes, ${payload.tracks.length} pistas, ` +
    `${payload.trackStats.length} stats, ${payload.settings.length} settings`
);
