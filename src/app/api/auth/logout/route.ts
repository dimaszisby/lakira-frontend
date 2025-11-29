import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  (await cookies()).set("lakira_token", "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
