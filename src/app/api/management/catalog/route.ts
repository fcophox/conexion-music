import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/management";
import { getCatalogWithStats } from "@/lib/catalog";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const albums = await getCatalogWithStats();
  return NextResponse.json(
    { albums },
    { headers: { "Cache-Control": "no-store" } }
  );
}
