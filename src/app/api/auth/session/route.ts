import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "lakira_token";
const ONE_WEEK = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body?.token;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: ONE_WEEK,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
