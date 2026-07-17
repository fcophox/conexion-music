import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { toggleTrackStatus } from "@/lib/catalog";

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let trackId = 0;
  let disabled: boolean | null = null;
  try {
    const body = await request.json();
    trackId = typeof body?.trackId === "number" ? body.trackId : 0;
    disabled = typeof body?.disabled === "boolean" ? body.disabled : null;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (!trackId || disabled === null) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const result = await toggleTrackStatus(trackId, disabled);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
