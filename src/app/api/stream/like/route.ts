import { NextRequest, NextResponse } from "next/server";
import { incrementLike } from "@/lib/catalog";

export async function POST(request: NextRequest) {
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
  } catch (error) {
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
