import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "clyfer_admin_session";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const correct = process.env.ADMIN_PASSWORD ?? "clyfer_admin_2024";

  if (password !== correct) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
