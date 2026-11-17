import { chatMessagesBody } from "./deepseek";
import { buildLessonMessages, fallbackLesson, lessonIsUsable, type Cursors, type LessonDraft } from "./study";

export async function writeLesson(draft: LessonDraft, cursors: Cursors): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return fallbackLesson(draft.subject);
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: chatMessagesBody("deepseek-chat", buildLessonMessages(draft, cursors)),
  });
  if (!response.ok) return fallbackLesson(draft.subject);
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = payload.choices?.[0]?.message?.content ?? "";
  return lessonIsUsable(draft.subject, text) ? text : fallbackLesson(draft.subject);
}
