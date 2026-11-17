import { verifySession } from "./auth";

export function hasSession(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  const pair = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("dr_session="));
  if (!pair) return false;
  const token = decodeURIComponent(pair.slice("dr_session=".length));
  return verifySession(process.env.SESSION_SECRET ?? "", token, Math.floor(Date.now() / 1000));
}
