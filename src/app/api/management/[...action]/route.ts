import { NextRequest, NextResponse } from "next/server";
import { checkPassword, newSessionToken, MGMT_COOKIE, isAuthenticated } from "@/lib/management";

export const dynamic = "force-dynamic";
import {
  getCatalog,
  getCatalogWithStats,
  getNextTrackId,
  addTrack,
  moveTrackToAlbum,
  reorderAlbumTracks,
  reorderAlbums,
  createAlbum,
  deleteAlbum,
  deleteTrack,
  renameTrack,
  toggleAlbumStatus,
  toggleTrackStatus,
  updateTrackDetails,
  updateAlbumDetails,
  generateImageUploadUrl,
  getMarketplaceProducts,
  createMarketplaceProduct,
  deleteMarketplaceProduct,
} from "@/lib/catalog";

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

const ALLOWED_EXTENSIONS = new Set([".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg"]);

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function getDuration(filePath: string): number {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
      { encoding: "utf-8" }
    );
    return Math.round(parseFloat(out.trim()) || 0);
  } catch {
    return 0;
  }
}

type RouteContext = {
  params: Promise<{ action: string[] }>;
};

// GET router
export async function GET(request: NextRequest, ctx: RouteContext) {
  const { action } = await ctx.params;
  const endpoint = action.join("/");

  if (endpoint === "catalog") {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const albums = await getCatalogWithStats();
    return NextResponse.json(
      { albums },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (endpoint === "marketplace") {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const products = await getMarketplaceProducts();
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}

// POST router
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { action } = await ctx.params;
  const endpoint = action.join("/");

  if (endpoint === "login") {
    let password = "";
    try {
      const body = await request.json();
      password = typeof body?.password === "string" ? body.password : "";
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const isValid = await checkPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(MGMT_COOKIE, newSessionToken(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  }

  if (endpoint === "logout") {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(MGMT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  // All subsequent POST endpoints require authentication
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (endpoint === "image-upload-url") {
    const uploadUrl = await generateImageUploadUrl();
    if (!uploadUrl) {
      return NextResponse.json({ error: "No se pudo generar la URL de subida" }, { status: 500 });
    }
    return NextResponse.json({ uploadUrl });
  }

  if (endpoint === "track-details") {
    let body: { trackId?: unknown; lyrics?: unknown; storageId?: unknown; removeImage?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const trackId = Number(body.trackId);
    if (!Number.isInteger(trackId) || trackId <= 0) {
      return NextResponse.json({ error: "trackId inválido" }, { status: 400 });
    }

    const lyrics = typeof body.lyrics === "string" ? body.lyrics.trim() : undefined;
    const storageId =
      typeof body.storageId === "string" && body.storageId ? body.storageId : undefined;
    const removeImage = body.removeImage === true;

    const result = await updateTrackDetails({
      trackId,
      lyrics,
      bgImageStorageId: storageId,
      removeImage,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, bgImage: result.bgImage, lyrics });
  }

  if (endpoint === "upload") {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const albumId = formData.get("albumId") as string | null;

    if (!file || !albumId) {
      return NextResponse.json({ error: "file and albumId required" }, { status: 400 });
    }

    const catalog = await getCatalog();
    const album = catalog.find((a) => a.id === albumId);
    if (!album) {
      return NextResponse.json({ error: "album not found" }, { status: 404 });
    }

    const trackId = await getNextTrackId();
    const root = process.cwd();
    const rawExt = path.extname(file.name).toLowerCase();
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : null;
    if (!ext) {
      return NextResponse.json(
        { error: `Formato no soportado. Usa: ${[...ALLOWED_EXTENSIONS].join(", ")}` },
        { status: 400 }
      );
    }
    const masterDir = path.join(root, "media", "masters");
    mkdirSync(masterDir, { recursive: true });
    const masterPath = path.join(masterDir, `${trackId}${ext}`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      writeFileSync(masterPath, Buffer.from(arrayBuffer));
      const duration = getDuration(masterPath);

      const scriptPath = [root, "scripts", "protect-audio.mjs"].join(path.sep);
      execFileSync("node", [scriptPath, masterPath, String(trackId)], {
        stdio: "pipe",
        cwd: root,
      });

      const existingTracks = album.tracks.length;
      const title = titleFromFilename(file.name);
      const result = await addTrack({
        trackId,
        albumId,
        title,
        artist: album.artist,
        album: album.title,
        duration,
        coverGradient: album.coverGradient,
        coverArtDesign: album.coverArtDesign as string,
        coverImage: album.coverImage,
        sortOrder: existingTracks,
      });

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ ok: true, trackId, title, duration });
    } catch (err) {
      console.error("Upload error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "unknown error" },
        { status: 500 }
      );
    } finally {
      if (existsSync(masterPath)) {
        rmSync(masterPath, { force: true });
      }
    }
  }

  if (endpoint === "create-album") {
    let title = "";
    let aboutIntro: string | undefined;
    let aboutDetails: string | undefined;
    try {
      const body = await request.json();
      title = typeof body?.title === "string" ? body.title.trim() : "";
      aboutIntro = typeof body?.aboutIntro === "string" ? body.aboutIntro.trim() : undefined;
      aboutDetails = typeof body?.aboutDetails === "string" ? body.aboutDetails.trim() : undefined;
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const result = await createAlbum(title, undefined, aboutIntro, aboutDetails);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, albumId: result.albumId });
  }

  if (endpoint === "delete-album") {
    let albumId = "";
    try {
      const body = await request.json();
      albumId = typeof body?.albumId === "string" ? body.albumId.trim() : "";
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!albumId) {
      return NextResponse.json({ error: "albumId is required" }, { status: 400 });
    }

    const result = await deleteAlbum(albumId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (endpoint === "delete-track") {
    let trackId: number | null = null;
    try {
      const body = await request.json();
      trackId = typeof body?.trackId === "number" ? body.trackId : null;
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (trackId === null) {
      return NextResponse.json({ error: "trackId is required" }, { status: 400 });
    }

    // 1. Delete processed audio files from disk
    const root = process.cwd();
    const hlsDir = path.join(root, "media", "hls", String(trackId));
    const keyFile = path.join(root, "media", "keys", `${trackId}.key`);

    try {
      if (existsSync(hlsDir)) {
        rmSync(hlsDir, { recursive: true, force: true });
      }
      if (existsSync(keyFile)) {
        rmSync(keyFile, { force: true });
      }
    } catch (fsError) {
      console.error("Error deleting track files from disk:", fsError);
    }

    // 2. Delete track metadata and stats in database
    const result = await deleteTrack(trackId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (endpoint === "create-marketplace-product") {
    let body: { name?: unknown; category?: unknown; price?: unknown; description?: unknown; imageStorageId?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const price = Number(body.price);
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    const imageStorageId = typeof body.imageStorageId === "string" && body.imageStorageId ? body.imageStorageId : undefined;

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "La categoría es requerida" }, { status: 400 });
    }
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: "El precio debe ser un número válido positivo" }, { status: 400 });
    }

    const result = await createMarketplaceProduct({
      name,
      category,
      price,
      description,
      imageStorageId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: result.id });
  }

  if (endpoint === "delete-marketplace-product") {
    let id = "";
    try {
      const body = await request.json();
      id = typeof body?.id === "string" ? body.id.trim() : "";
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: "El id es requerido" }, { status: 400 });
    }

    const result = await deleteMarketplaceProduct(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}

// PUT router
export async function PUT(request: NextRequest, ctx: RouteContext) {
  const { action } = await ctx.params;
  const endpoint = action.join("/");

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (endpoint === "move") {
    let trackId = 0;
    let targetAlbumId = "";
    try {
      const body = await request.json();
      trackId = typeof body?.trackId === "number" ? body.trackId : 0;
      targetAlbumId = typeof body?.targetAlbumId === "string" ? body.targetAlbumId : "";
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!trackId || !targetAlbumId) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const result = await moveTrackToAlbum(trackId, targetAlbumId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (endpoint === "order") {
    let albumId = "";
    let trackIds: number[] = [];
    try {
      const body = await request.json();
      albumId = typeof body?.albumId === "string" ? body.albumId : "";
      trackIds = Array.isArray(body?.trackIds)
        ? body.trackIds.map(Number).filter((n: number) => Number.isInteger(n))
        : [];
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!albumId || trackIds.length === 0) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const result = await reorderAlbumTracks(albumId, trackIds);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (endpoint === "order-albums") {
    let albumIds: string[] = [];
    let rawBody: any = null;
    try {
      rawBody = await request.json();
      console.log("[DEBUG order-albums] body:", JSON.stringify(rawBody));
      albumIds = Array.isArray(rawBody?.albumIds)
        ? rawBody.albumIds.map((id: unknown) => String(id)).filter(Boolean)
        : [];
    } catch (e) {
      console.error("[DEBUG order-albums] JSON error:", e);
      return NextResponse.json({ error: "bad request: invalid json" }, { status: 400 });
    }

    if (albumIds.length === 0) {
      console.error("[DEBUG order-albums] empty albumIds array");
      return NextResponse.json({ error: "bad request: empty albumIds" }, { status: 400 });
    }

    const result = await reorderAlbums(albumIds);
    console.log("[DEBUG order-albums] reorderAlbums result:", result);
    if (!result.ok) {
      console.error("[DEBUG order-albums] mutation failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (endpoint === "album-details") {
    let albumId = "";
    let title: string | undefined;
    let coverStorageId: any;
    let year: number | undefined;
    let aboutIntro: string | undefined;
    let aboutDetails: string | undefined;
    try {
      const body = await request.json();
      albumId = typeof body?.albumId === "string" ? body.albumId : "";
      title = typeof body?.title === "string" ? body.title : undefined;
      coverStorageId = typeof body?.coverStorageId === "string" && body.coverStorageId ? body.coverStorageId : undefined;
      year = typeof body?.year === "number" ? body.year : undefined;
      aboutIntro = typeof body?.aboutIntro === "string" ? body.aboutIntro : undefined;
      aboutDetails = typeof body?.aboutDetails === "string" ? body.aboutDetails : undefined;
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!albumId) {
      return NextResponse.json({ error: "albumId es requerido" }, { status: 400 });
    }

    console.log("[album-details] Request:", { albumId, title, coverStorageId, year, aboutIntro, aboutDetails });

    const result = await updateAlbumDetails({ albumId, title, coverStorageId, year, aboutIntro, aboutDetails });
    console.log("[album-details] Result:", JSON.stringify(result));
    if (!result.ok) {
      console.error("[album-details route error]", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      title: result.title,
      coverImage: result.coverImage,
      year: result.year,
      aboutIntro: result.aboutIntro,
      aboutDetails: result.aboutDetails,
    });
  }

  if (endpoint === "rename") {
    let trackId = 0;
    let title = "";
    try {
      const body = await request.json();
      trackId = typeof body?.trackId === "number" ? body.trackId : 0;
      title = typeof body?.title === "string" ? body.title.trim() : "";
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!trackId || !title || title.length > 120) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const result = await renameTrack(trackId, title);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (endpoint === "status") {
    let albumId = "";
    let disabled = false;
    try {
      const body = await request.json();
      albumId = typeof body?.albumId === "string" ? body.albumId : "";
      disabled = Boolean(body?.disabled);
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!albumId) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const result = await toggleAlbumStatus(albumId, disabled);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (endpoint === "track-status") {
    let trackId = 0;
    let disabled: boolean | null = null;
    try {
      const body = await request.json();
      trackId = typeof body?.trackId === "number" ? body.trackId : 0;
      disabled = typeof body?.disabled === "boolean" ? body.disabled : null;
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    if (!trackId || disabled === null) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const result = await toggleTrackStatus(trackId, disabled);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}
