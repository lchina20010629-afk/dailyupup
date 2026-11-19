import { NextResponse } from "next/server";
import { askById, attachAskFragment, deleteAsk, deleteFragment, insertFragment, polishedAtFor } from "@/db/repository";
import { askDiaryBody } from "@/lib/asks";
import { canMutate } from "@/lib/fragments";
import { hasSession } from "@/lib/requestAuth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSession(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await context.params;
  const ask = await askById(id);
  if (!ask) return NextResponse.json({ error: "没有这条提问" }, { status: 404 });
  if (ask.fragmentId) return NextResponse.json({ ask });
  if (!canMutate(await polishedAtFor(ask.day))) return NextResponse.json({ error: "已经整理，不能再改" }, { status: 409 });
  const fragmentId = crypto.randomUUID();
  await insertFragment({
    id: fragmentId,
    day: ask.day,
    createdAt: new Date(ask.createdAt),
    body: askDiaryBody(ask),
    media: [],
  });
  await attachAskFragment(id, fragmentId);
  return NextResponse.json({ ask: { ...ask, fragmentId } });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSession(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await context.params;
  const ask = await askById(id);
  if (!ask) return NextResponse.json({ error: "没有这条提问" }, { status: 404 });
  if (!canMutate(await polishedAtFor(ask.day))) return NextResponse.json({ error: "已经整理，不能再删" }, { status: 409 });
  if (ask.fragmentId) await deleteFragment(ask.fragmentId);
  await deleteAsk(id);
  return NextResponse.json({ ok: true });
}
