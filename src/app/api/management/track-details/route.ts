import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { updateTrackDetails } from "@/lib/catalog";

// Guarda la letra y/o asocia la imagen de fondo de una canción. La imagen ya
// fue subida por el navegador directo al storage de Convex (ver
// /api/management/image-upload-url); aquí solo llega su storageId.
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
