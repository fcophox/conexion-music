import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  KEYS_ROOT,
  SESSION_COOKIE,
  isSafeId,
  isValidSessionId,
  verifyToken,
  allowKeyRequest,
  NO_STORE_HEADERS,
} from "@/lib/stream";

// Entrega la clave AES-128 de una pista SOLO si la petición trae la cookie de
// sesión válida y un token firmado, no expirado, emitido para esa misma sesión.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/stream/[trackId]/key">
) {
  const { trackId } = await ctx.params;
  if (!isSafeId(trackId)) {
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

  if (!allowKeyRequest(sessionId)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  let key: Buffer;
  try {
    key = await readFile(path.join(KEYS_ROOT, `${trackId}.key`));
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(key), {
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(key.length),
    },
  });
}
