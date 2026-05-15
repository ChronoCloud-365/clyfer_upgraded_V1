import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "clyfer_admin_session";
export const ADMIN_SESSION_VALUE = "authenticated";

export function hasAdminSession(request: NextRequest) {
  return request.cookies.get(ADMIN_COOKIE)?.value === ADMIN_SESSION_VALUE;
}

export function requireAdminSession(request: NextRequest) {
  if (hasAdminSession(request)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
