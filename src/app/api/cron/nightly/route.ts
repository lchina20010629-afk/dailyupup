import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cronAuth";
import { runNightly } from "@/lib/nightly";
import { chatMessagesBody } from "@/lib/deepseek";
import { loadCursors, loadStudy, loadUnpolished, saveCursors, saveLessons, savePolish } from "@/db/repository";

export const maxDuration = 300;

async function nightly(request: Request) {
  if (!cronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET ?? "")) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    const result = await runNightly({
      now: new Date(),
      loadUnpolished,
      savePolish,
      loadStudy,
      loadCursors,
      saveCursors,
      saveLessons,
      chat: async (messages) => {
        const key = process.env.DEEPSEEK_API_KEY;
        if (!key) throw new Error("缺少 DEEPSEEK_API_KEY");
        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: chatMessagesBody("deepseek-chat", messages),
        });
        if (!response.ok) throw new Error(`DeepSeek ${response.status}`);
        const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
        return payload.choices?.[0]?.message?.content ?? "";
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "整理失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = nightly;
export const POST = nightly;
