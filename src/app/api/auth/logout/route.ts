import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/constants/app";

export async function POST() {
  // Clearing must repeat every attribute the setter used. A clear that omits
  // one can leave the original cookie in place, keeping a "logged out" session
  // live.
  (await cookies()).set(SESSION_COOKIE_NAME, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
