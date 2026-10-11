import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "./admin-session";

export { ADMIN_COOKIE } from "./admin-session";

export function hasAdminSession(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export function requireAdminSession(request: NextRequest) {
  if (hasAdminSession(request)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
