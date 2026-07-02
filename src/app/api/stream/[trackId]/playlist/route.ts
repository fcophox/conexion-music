import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  HLS_ROOT,
  SESSION_COOKIE,
  isSafeId,
  isValidSessionId,
  newSessionId,
  signToken,
  NO_STORE_HEADERS,
} from "@/lib/stream";

// Sirve la playlist HLS reescrita: la URI de la clave y cada segmento llevan
// un token firmado ligado a esta sesión, con expiración.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/stream/[trackId]/playlist">
) {
  const { trackId } = await ctx.params;
  if (!isSafeId(trackId)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  let sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const needsCookie = !isValidSessionId(sessionId);
  if (needsCookie) sessionId = newSessionId();

  let manifest: string;
  try {
    manifest = await readFile(
      path.join(HLS_ROOT, trackId, "index.m3u8"),
      "utf-8"
    );
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const token = signToken(trackId, sessionId!);
  const rewritten = manifest
    .replace('URI="__KEY_URI__"', `URI="/api/stream/${trackId}/key?tk=${token}"`)
    .replace(/^(seg_\d+\.ts)$/gm, `$1?tk=${token}`);

  const response = new NextResponse(rewritten, {
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "application/vnd.apple.mpegurl",
    },
  });

  if (needsCookie) {
    response.cookies.set(SESSION_COOKIE, sessionId!, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/stream",
    });
  }

  return response;
}
