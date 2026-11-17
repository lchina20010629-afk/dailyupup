import { NextResponse } from "next/server";
import { hasSession } from "@/lib/requestAuth";
import { markStudyDone } from "@/db/repository";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSession(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await context.params;
  try {
    await markStudyDone(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "没有记下";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
