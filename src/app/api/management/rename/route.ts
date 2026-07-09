import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { renameTrack } from "@/lib/catalog";

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let trackId = 0;
  let title = "";
  try {
    const body = await request.json();
    trackId = typeof body?.trackId === "number" ? body.trackId : 0;
    title = typeof body?.title === "string" ? body.title.trim() : "";
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (!trackId || !title || title.length > 120) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const result = await renameTrack(trackId, title);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
