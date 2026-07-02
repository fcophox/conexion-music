import { readdir, access } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  HLS_ROOT,
  SESSION_COOKIE,
  isValidSessionId,
  newSessionId,
  NO_STORE_HEADERS,
} from "@/lib/stream";

// Devuelve qué pistas tienen audio real disponible y abre la sesión de
// reproducción (cookie httpOnly) que exigen el resto de endpoints.
export async function GET(request: NextRequest) {
  let ids: string[] = [];
  try {
    const entries = await readdir(HLS_ROOT, { withFileTypes: true });
    const checks = await Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map(async (e) => {
          try {
            await access(path.join(HLS_ROOT, e.name, "index.m3u8"));
            return e.name;
          } catch {
            return null;
          }
        })
    );
    ids = checks.filter((id): id is string => id !== null);
  } catch {
    // sin carpeta media/hls todavía: catálogo vacío
  }

  const response = NextResponse.json({ tracks: ids }, { headers: NO_STORE_HEADERS });

  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (!isValidSessionId(existing)) {
    response.cookies.set(SESSION_COOKIE, newSessionId(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/stream",
    });
  }

  return response;
}
