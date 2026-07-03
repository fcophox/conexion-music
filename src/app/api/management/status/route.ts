import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { toggleAlbumStatus } from "@/lib/catalog";

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let albumId = "";
  let disabled = false;
  try {
    const body = await request.json();
    albumId = typeof body?.albumId === "string" ? body.albumId : "";
    disabled = Boolean(body?.disabled);
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (!albumId) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const result = await toggleAlbumStatus(albumId, disabled);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
