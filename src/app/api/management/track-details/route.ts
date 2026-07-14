import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { updateTrackDetails } from "@/lib/catalog";
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

// Extensiones de imagen aceptadas. La extensión viene del nombre del archivo
// subido (no confiable): solo se usa si está en esta lista.
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

const IMAGES_DIR = path.join(process.cwd(), "media", "track-images");

function removeExistingImages(trackId: number) {
  for (const ext of ALLOWED_EXTENSIONS) {
    const p = path.join(IMAGES_DIR, `${trackId}${ext}`);
    if (existsSync(p)) rmSync(p, { force: true });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const trackId = Number(formData.get("trackId"));
  if (!Number.isInteger(trackId) || trackId <= 0) {
    return NextResponse.json({ error: "trackId inválido" }, { status: 400 });
  }

  const image = formData.get("image");
  const lyricsRaw = formData.get("lyrics");
  const removeImage = formData.get("removeImage") === "1";

  const details: { trackId: number; bgImage?: string; lyrics?: string } = { trackId };

  if (typeof lyricsRaw === "string") {
    details.lyrics = lyricsRaw.trim();
  }

  if (removeImage) {
    removeExistingImages(trackId);
    details.bgImage = "";
  } else if (image instanceof File && image.size > 0) {
    const ext = path.extname(image.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Formato no soportado. Usa: ${[...ALLOWED_EXTENSIONS].join(", ")}` },
        { status: 400 }
      );
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "La imagen supera los 8 MB" }, { status: 400 });
    }
    mkdirSync(IMAGES_DIR, { recursive: true });
    removeExistingImages(trackId);
    const arrayBuffer = await image.arrayBuffer();
    writeFileSync(path.join(IMAGES_DIR, `${trackId}${ext}`), Buffer.from(arrayBuffer));
    // El parámetro v evita que el navegador siga mostrando la imagen anterior.
    details.bgImage = `/api/track-image/${trackId}?v=${Date.now()}`;
  }

  const result = await updateTrackDetails(details);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, bgImage: details.bgImage, lyrics: details.lyrics });
}
