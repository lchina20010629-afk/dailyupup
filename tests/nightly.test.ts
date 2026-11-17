import { describe, expect, it } from "vitest";
import { chatMessagesBody } from "../src/lib/deepseek";
import { runNightly } from "../src/lib/nightly";
import type { Fragment } from "../src/domain/types";
import type { StudyItem } from "../src/lib/study";

describe("nightly order", () => {
  it("polishes the oldest unpolished day first and does not advance a failed Thai lesson", async () => {
    const calls: string[] = [];
    const fragment = (day: string): Fragment => ({
      id: day,
      day,
      createdAt: `${day}T01:00:00.000Z`,
      body: "晨跑",
      media: [],
    });
    const todayItems: StudyItem[] = [
      { id: "english", day: "2026-11-18", subject: "english", minutes: 8, title: "旧", body: "旧英语", done: true, unit: 1 },
      { id: "thai", day: "2026-11-18", subject: "thai", minutes: 8, title: "旧", body: "旧泰语", done: true, unit: 1 },
      { id: "business", day: "2026-11-18", subject: "business", minutes: 8, title: "旧", body: "旧商业", done: false, unit: null },
      { id: "cultivation", day: "2026-11-18", subject: "cultivation", minutes: 6, title: "旧", body: "旧修养", done: true, unit: null },
    ];
    let savedBody = "";
    const result = await runNightly({
      now: new Date("2026-11-18T15:05:00.000Z"),
      loadUnpolished: async () => [fragment("2026-11-16"), fragment("2026-11-17"), fragment("2026-11-18")],
      savePolish: async (_day, body) => {
        savedBody = body;
      },
      loadStudy: async () => todayItems,
      loadCursors: async () => ({ english: 0, thai: 0 }),
      saveCursors: async (cursors) => {
        calls.push(`cursors:${cursors.english}:${cursors.thai}`);
      },
      saveLessons: async (_day, items) => {
        calls.push(items.map((item) => `${item.subject}:${item.body}`).join("|"));
      },
      chat: async (messages) => {
        calls.push(messages[0].content.slice(0, 12));
        if (messages[0].content.includes("字母和读音")) return "太短";
        if (messages[0].content.includes("日常使用")) return "场景：请假\n对话：I need to step out.\n今天说：我今天会说的一句";
        return "这是一段足够长的新课文，用来填满二十个字。";
      },
    });
    expect(savedBody.length).toBeGreaterThan(0);
    expect(result).toEqual({ polishedDays: ["2026-11-16", "2026-11-17"], studyDay: "2026-11-19" });
    expect(calls.at(-1)).toBe("cursors:1:0");
    expect(calls.join("\n")).toContain("thai:今晚这门没写成，明天会再写。");
    expect(chatMessagesBody("deepseek-chat", [{ role: "user", content: "hi" }])).toContain("deepseek-chat");
  });
});
