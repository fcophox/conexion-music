import "server-only";
import { readFile, writeFile, mkdir, rename } from "fs/promises";
import path from "path";
import type { Album, AlbumWithStats } from "./catalog-types";
import { SEED_ALBUMS } from "./seed";

// Fuente de verdad del catálogo en disco. Para un despliegue self-hosted de un
// solo servidor (el modelo de este proyecto) un JSON es suficiente y simple.
const DATA_ROOT = path.join(process.cwd(), "data");
const CATALOG_PATH = path.join(DATA_ROOT, "catalog.json");
const PLAYS_PATH = path.join(DATA_ROOT, "plays.json");

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf-8")) as T;
  } catch {
    return null;
  }
}

// Escritura atómica: escribe a un temporal y renombra, para que un lector nunca
// vea un JSON a medio escribir.
async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await mkdir(DATA_ROOT, { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await rename(tmp, file);
}

export async function getCatalog(): Promise<Album[]> {
  const existing = await readJson<Album[]>(CATALOG_PATH);
  if (existing) return existing;
  // Primer arranque: sembrar desde SEED_ALBUMS.
  await writeJsonAtomic(CATALOG_PATH, SEED_ALBUMS);
  return SEED_ALBUMS;
}

export async function getPlays(): Promise<Record<string, number>> {
  return (await readJson<Record<string, number>>(PLAYS_PATH)) ?? {};
}

export async function incrementPlay(trackId: number): Promise<number> {
  const plays = await getPlays();
  const next = (plays[trackId] ?? 0) + 1;
  plays[trackId] = next;
  await writeJsonAtomic(PLAYS_PATH, plays);
  return next;
}

// Catálogo con el número de reproducciones incrustado en cada pista (para /management).
export async function getCatalogWithStats(): Promise<AlbumWithStats[]> {
  const [albums, plays] = await Promise.all([getCatalog(), getPlays()]);
  return albums.map((album) => ({
    ...album,
    tracks: album.tracks.map((t) => ({ ...t, plays: plays[t.id] ?? 0 })),
  }));
}

// Reordena las pistas de un álbum según la lista de IDs recibida. Solo cambia el
// orden: valida que el conjunto de IDs coincida exactamente con el del álbum para
// no perder ni inventar pistas.
export async function reorderAlbumTracks(
  albumId: string,
  orderedTrackIds: number[]
): Promise<{ ok: boolean; error?: string }> {
  const albums = await getCatalog();
  const album = albums.find((a) => a.id === albumId);
  if (!album) return { ok: false, error: "album not found" };

  const currentIds = album.tracks.map((t) => t.id).sort((a, b) => a - b);
  const nextIds = [...orderedTrackIds].sort((a, b) => a - b);
  const sameSet =
    currentIds.length === nextIds.length &&
    currentIds.every((id, i) => id === nextIds[i]);
  if (!sameSet) return { ok: false, error: "track id set mismatch" };

  const byId = new Map(album.tracks.map((t) => [t.id, t]));
  album.tracks = orderedTrackIds.map((id) => byId.get(id)!);

  await writeJsonAtomic(CATALOG_PATH, albums);
  return { ok: true };
}
