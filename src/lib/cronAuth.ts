import { createHash, timingSafeEqual } from "node:crypto";

export function cronAuthorized(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const provided = header.slice("Bearer ".length);
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(secret).digest();
  return timingSafeEqual(left, right);
}
