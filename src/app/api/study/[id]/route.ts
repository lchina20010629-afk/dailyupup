import { NextResponse } from "next/server";
import { markStudyDone } from "@/db/repository";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await markStudyDone(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "没有记下";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
