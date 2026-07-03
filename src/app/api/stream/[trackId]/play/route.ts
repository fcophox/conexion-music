import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  isSafeId,
  isValidSessionId,
  NO_STORE_HEADERS,
} from "@/lib/stream";
import { incrementPlay } from "@/lib/catalog";

// Registra una reproducción de la pista. Lo llama el reproductor cuando una
// canción real empieza a sonar (una vez por reproducción). Exige la cookie de
// sesión de streaming para evitar conteos anónimos triviales.
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/stream/[trackId]/play">
) {
  const { trackId } = await ctx.params;
  if (!isSafeId(trackId) || !/^\d+$/.test(trackId)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSessionId(sessionId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const plays = await incrementPlay(Number(trackId));
  return NextResponse.json({ ok: true, plays }, { headers: NO_STORE_HEADERS });
}
