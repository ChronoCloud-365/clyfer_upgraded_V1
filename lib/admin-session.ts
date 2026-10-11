import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "clyfer_admin_session";
const lifetime = 60 * 60 * 24 * 7;
function sign(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  return secret ? createHmac("sha256", secret).update(value).digest("hex") : "";
}
export function createAdminSessionToken() {
  const expires = String(Math.floor(Date.now() / 1000) + lifetime);
  const signature = sign(expires);
  if (!signature) throw new Error("Admin session is not configured.");
  return `${expires}.${signature}`;
}
export function isValidAdminSession(token: string | undefined) {
  if (!token) return false;
  const [expires, signature, extra] = token.split(".");
  if (extra || !/^\d+$/.test(expires) || !signature || !/^[a-f0-9]{64}$/.test(signature)) return false;
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = sign(expires);
  return Boolean(expected) && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
