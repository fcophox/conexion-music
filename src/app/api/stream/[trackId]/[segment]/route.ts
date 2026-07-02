import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  HLS_ROOT,
  SESSION_COOKIE,
  isSafeId,
  isSafeSegmentName,
  isValidSessionId,
  verifyToken,
  NO_STORE_HEADERS,
} from "@/lib/stream";

// Sirve un segmento HLS cifrado. Aunque alguien lo descargue desde la pestaña
// Network, sin la clave (protegida en /key) es ruido AES inservible.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/stream/[trackId]/[segment]">
) {
  const { trackId, segment } = await ctx.params;
  if (!isSafeId(trackId) || !isSafeSegmentName(segment)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSessionId(sessionId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = request.nextUrl.searchParams.get("tk");
  if (!verifyToken(token, trackId, sessionId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let data: Buffer;
  try {
    data = await readFile(path.join(HLS_ROOT, trackId, segment));
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "video/mp2t",
      "Content-Length": String(data.length),
    },
  });
}
