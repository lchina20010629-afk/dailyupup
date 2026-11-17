import { NextResponse } from "next/server";
import { canMutate } from "@/lib/fragments";
import { hasSession } from "@/lib/requestAuth";
import { deleteFragment, fragmentDay, polishedAtFor, updateFragmentBody } from "@/db/repository";

async function locked(id: string): Promise<boolean> {
  const day = await fragmentDay(id);
  if (!day) return false;
  return !canMutate(await polishedAtFor(day));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSession(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await context.params;
  try {
    if (await locked(id)) return NextResponse.json({ error: "已经整理，不能再改" }, { status: 409 });
    const body = (await request.json().catch(() => null)) as { body?: string } | null;
    await updateFragmentBody(id, body?.body ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSession(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await context.params;
  try {
    if (await locked(id)) return NextResponse.json({ error: "已经整理，不能再删" }, { status: 409 });
    await deleteFragment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
