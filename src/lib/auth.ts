import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function passwordsMatch(input: string, expected: string): boolean {
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function signSession(secret: string, exp: number): string {
  const payload = String(exp);
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifySession(secret: string, token: string, nowSeconds: number): boolean {
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || nowSeconds >= exp) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function sessionCookie(token: string, secure: boolean) {
  return {
    name: "dr_session" as const,
    value: token,
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/" as const,
    secure,
    maxAge: 2592000,
  };
}

export function pageGate(pathname: string, hasSession: boolean): "allow" | "to-login" | "to-today" | "to-study" {
  if (pathname.startsWith("/api/cron") || pathname.startsWith("/api/login")) return "allow";
  if (pathname === "/login") return hasSession ? "to-today" : "allow";
  if (pathname === "/") return hasSession ? "to-today" : "to-study";
  const isPrivate = pathname === "/today" || pathname.startsWith("/diary");
  if (!isPrivate) return "allow";
  if (!hasSession) return "to-login";
  return "allow";
}
