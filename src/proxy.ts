import { NextResponse, type NextRequest } from "next/server";
import { pageGate, verifySession } from "./lib/auth";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("dr_session")?.value;
  const hasSession = token
    ? verifySession(process.env.SESSION_SECRET ?? "", token, Math.floor(Date.now() / 1000))
    : false;
  const decision = pageGate(request.nextUrl.pathname, hasSession);
  if (decision === "to-login") return NextResponse.redirect(new URL("/login", request.url));
  if (decision === "to-today") return NextResponse.redirect(new URL("/today", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
