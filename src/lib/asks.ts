import type { Ask, Fragment } from "../domain/types";

export type { Ask };

const ANSWER_PROMPT = "用中文直接回答。短一些，最多四句。不要用星号、编号和标题。不要编造对方没问的生活事件。不要写成日记。";

export function isBlankQuestion(text: string): boolean {
  return text.trim().length === 0;
}

export function answerIsUsable(answer: string): boolean {
  return answer.trim().length > 0;
}

export function askDiaryBody(ask: Pick<Ask, "question" | "answer">): string {
  return `问：${ask.question}\n答：${ask.answer}`;
}

export function askMessages(question: string): { role: "system" | "user"; content: string }[] {
  return [
    { role: "system", content: ANSWER_PROMPT },
    { role: "user", content: question },
  ];
}

export function keepAsk(ask: Ask, fragmentId: string): Ask {
  if (ask.fragmentId) return ask;
  return { ...ask, fragmentId };
}

export function threadItems(
  fragments: Fragment[],
  asks: Ask[],
): ({ kind: "note"; fragment: Fragment } | { kind: "ask"; ask: Ask })[] {
  const hidden = new Set(asks.flatMap((item) => (item.fragmentId ? [item.fragmentId] : [])));
  const notes = fragments
    .filter((item) => !hidden.has(item.id))
    .map((fragment) => ({ kind: "note" as const, at: fragment.createdAt, fragment }));
  const questions = asks.map((item) => ({ kind: "ask" as const, at: item.createdAt, ask: item }));
  return [...notes, ...questions]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((item) => (item.kind === "note" ? { kind: "note", fragment: item.fragment } : { kind: "ask", ask: item.ask }));
}
