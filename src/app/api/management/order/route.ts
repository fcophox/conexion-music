import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { reorderAlbumTracks } from "@/lib/catalog";

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let albumId = "";
  let trackIds: number[] = [];
  try {
    const body = await request.json();
    albumId = typeof body?.albumId === "string" ? body.albumId : "";
    trackIds = Array.isArray(body?.trackIds)
      ? body.trackIds.map(Number).filter((n: number) => Number.isInteger(n))
      : [];
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (!albumId || trackIds.length === 0) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const result = await reorderAlbumTracks(albumId, trackIds);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
