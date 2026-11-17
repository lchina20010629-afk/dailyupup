import { NextResponse } from "next/server";
import { passwordsMatch, sessionCookie, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected || !passwordsMatch(body?.password ?? "", expected)) {
    return NextResponse.json({ error: "密码不对" }, { status: 401 });
  }
  const exp = Math.floor(Date.now() / 1000) + 2_592_000;
  const token = signSession(process.env.SESSION_SECRET ?? "", exp);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie(token, process.env.NODE_ENV === "production"));
  return response;
}
