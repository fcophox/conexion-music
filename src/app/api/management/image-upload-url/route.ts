import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { generateImageUploadUrl } from "@/lib/catalog";

// Entrega una URL temporal del storage de Convex para que el navegador suba
// la imagen directamente (sin pasar por el disco efímero de Vercel).
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const uploadUrl = await generateImageUploadUrl();
  if (!uploadUrl) {
    return NextResponse.json({ error: "No se pudo generar la URL de subida" }, { status: 500 });
  }
  return NextResponse.json({ uploadUrl });
}
