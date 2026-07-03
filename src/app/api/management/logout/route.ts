import { NextResponse } from "next/server";
import { MGMT_COOKIE } from "@/lib/management";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(MGMT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
