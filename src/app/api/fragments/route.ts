import { NextResponse } from "next/server";
import { shanghaiDate } from "@/lib/time";
import { assertCanSave } from "@/lib/fragments";
import { hasSession } from "@/lib/requestAuth";
import { objectKey, signUpload } from "@/lib/r2";
import { insertFragment } from "@/db/repository";
import type { MediaKind } from "@/domain/types";

export async function POST(request: Request) {
  if (!hasSession(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    body?: string;
    media?: { kind: MediaKind; contentType: string; byteSize: number }[];
  } | null;
  const text = body?.body ?? "";
  const files = body?.media ?? [];
  const verdict = assertCanSave({ body: text, media: files });
  if (verdict !== "ok") return NextResponse.json({ error: verdict }, { status: 400 });
  const now = new Date();
  const day = shanghaiDate(now);
  const id = crypto.randomUUID();
  const stored = files.map((file) => {
    const mediaId = crypto.randomUUID();
    return { ...file, id: mediaId, r2Key: objectKey(day, id, mediaId) };
  });
  try {
    const uploads = await Promise.all(
      stored.map(async (file) => ({
        mediaId: file.id,
        key: file.r2Key,
        url: await signUpload(file.r2Key, file.contentType),
      })),
    );
    await insertFragment({ id, day, createdAt: now, body: text, media: stored });
    return NextResponse.json({
      fragment: {
        id,
        day,
        createdAt: now.toISOString(),
        body: text,
        media: stored.map((file) => ({ id: file.id, kind: file.kind, byteSize: file.byteSize })),
      },
      uploads,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
