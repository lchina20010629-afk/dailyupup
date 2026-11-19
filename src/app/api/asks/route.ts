import { NextResponse } from "next/server";
import { insertAsk } from "@/db/repository";
import { answerIsUsable, askMessages, isBlankQuestion } from "@/lib/asks";
import { chatMessagesBody } from "@/lib/deepseek";
import { hasSession } from "@/lib/requestAuth";
import { shanghaiDate } from "@/lib/time";

export async function POST(request: Request) {
  if (!hasSession(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { question?: string } | null;
  const question = (body?.question ?? "").trim();
  if (isBlankQuestion(question)) return NextResponse.json({ error: "写一句再问" }, { status: 400 });
  const answer = await requestAnswer(question);
  if (!answer) return NextResponse.json({ error: "没问成，再试一次。" }, { status: 502 });
  const now = new Date();
  const ask = {
    id: crypto.randomUUID(),
    day: shanghaiDate(now),
    createdAt: now.toISOString(),
    question,
    answer,
    fragmentId: null,
  };
  await insertAsk({ id: ask.id, day: ask.day, createdAt: now, question, answer });
  return NextResponse.json({ ask });
}

async function requestAnswer(question: string): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: chatMessagesBody("deepseek-chat", askMessages(question)),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
  return answerIsUsable(text) ? text : null;
}
