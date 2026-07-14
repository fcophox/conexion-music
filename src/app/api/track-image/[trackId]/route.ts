import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "node:fs";

// Sirve la imagen de fondo asociada a una canción (subida desde el panel de
// administración a media/track-images). Es contenido público, igual que las
// carátulas de public/cd.
const IMAGES_DIR = path.join(process.cwd(), "media", "track-images");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/track-image/[trackId]">
) {
  const { trackId } = await ctx.params;
  if (!/^\d+$/.test(trackId)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  for (const [ext, contentType] of Object.entries(CONTENT_TYPES)) {
    const filePath = path.join(IMAGES_DIR, `${trackId}${ext}`);
    if (!existsSync(filePath)) continue;
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.length),
        // La URL guardada incluye ?v=<timestamp>, así que se puede cachear.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}
