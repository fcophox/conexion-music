import { readFile, readdir, access } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  HLS_ROOT,
  KEYS_ROOT,
  SESSION_COOKIE,
  isSafeId,
  isSafeSegmentName,
  isValidSessionId,
  newSessionId,
  signToken,
  verifyToken,
  allowKeyRequest,
  NO_STORE_HEADERS,
} from "@/lib/stream";
import { incrementLike, incrementPlay } from "@/lib/catalog";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

// GET router
export async function GET(request: NextRequest, ctx: RouteContext) {
  const { path: pathSegments } = await ctx.params;

  // Endpoint: /api/stream/catalog
  if (pathSegments.length === 1 && pathSegments[0] === "catalog") {
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

  // Two-level endpoints: /api/stream/[trackId]/playlist, /api/stream/[trackId]/key, or /api/stream/[trackId]/[segment]
  if (pathSegments.length === 2) {
    const [trackId, actionOrSegment] = pathSegments;

    // Endpoint: /api/stream/[trackId]/playlist
    if (actionOrSegment === "playlist") {
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

    // Endpoint: /api/stream/[trackId]/key
    if (actionOrSegment === "key") {
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

    // Endpoint: /api/stream/[trackId]/[segment] (e.g. seg_0.ts)
    const segment = actionOrSegment;
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

  return NextResponse.json({ error: "not found" }, { status: 404 });
}

// POST router
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { path: pathSegments } = await ctx.params;

  // Endpoint: /api/stream/like
  if (pathSegments.length === 1 && pathSegments[0] === "like") {
    let trackId = 0;
    try {
      const body = await request.json();
      trackId = Number(body?.trackId);
      if (!Number.isInteger(trackId)) {
        throw new Error();
      }
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    try {
      const next = await incrementLike(trackId);
      return NextResponse.json({ likes: next });
    } catch {
      return NextResponse.json({ error: "internal server error" }, { status: 500 });
    }
  }

  // Endpoint: /api/stream/[trackId]/play
  if (pathSegments.length === 2 && pathSegments[1] === "play") {
    const trackId = pathSegments[0];
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

  return NextResponse.json({ error: "not found" }, { status: 404 });
}
