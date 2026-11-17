import type { Fragment } from "../domain/types";
import { shanghaiClock } from "./time";

export const PENDING_POLISH = "今晚会收成一篇";

function mediaLine(kind: Fragment["media"][number]["kind"], clock: string): string {
  return kind === "photo" ? `${clock} 这个时间加了一张照片` : `${clock} 这个时间加了一段视频`;
}

export function fragmentBlock(fragment: Fragment): string {
  const clock = shanghaiClock(new Date(fragment.createdAt));
  const lines = fragment.media.map((item) => mediaLine(item.kind, clock));
  if (fragment.body.trim().length === 0) return lines.join("\n");
  return [fragment.body, ...lines].join("\n");
}

export function buildPolishMessages(day: string, fragments: Fragment[]): { role: "system" | "user"; content: string }[] {
  const blocks = [...fragments]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((fragment) => fragmentBlock(fragment));
  return [
    {
      role: "system",
      content: [
        `把 ${day} 的记录收成日记正文，不要标题。`,
        "保留本人的用词和具体细节。",
        "把零碎句子补顺。",
        "按时间排列。",
        "不编写没有记过的事。",
        "不描述照片或视频里的画面。",
      ].join("\n"),
    },
    { role: "user", content: blocks.join("\n\n") },
  ];
}
