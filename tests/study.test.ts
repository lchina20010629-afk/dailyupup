import { describe, expect, it } from "vitest";
import {
  buildLessonMessages,
  ensureToday,
  fallbackLesson,
  initialCursors,
  lessonIsUsable,
  needsModel,
  SUBJECT_MINUTES,
  tomorrowsPlan,
  type StudyItem,
} from "../src/lib/study";

function item(partial: Partial<StudyItem> & Pick<StudyItem, "subject" | "done">): StudyItem {
  return {
    id: partial.subject,
    day: "2026-11-18",
    minutes: SUBJECT_MINUTES[partial.subject],
    title: partial.title ?? partial.subject,
    body: partial.body ?? "旧课文",
    unit: partial.unit ?? (partial.subject === "english" || partial.subject === "thai" ? 1 : null),
    ...partial,
  };
}

describe("english cursor", () => {
  it("repeats an unchecked unit and advances a checked unit by one", () => {
    const cursors = { english: 0, thai: 0 };
    const stayed = tomorrowsPlan({
      nextDay: "2026-11-19",
      todayItems: [
        item({ subject: "english", done: false, unit: 1, body: "旧英语" }),
        item({ subject: "thai", done: true, unit: 1 }),
        item({ subject: "business", done: false, body: "旧商业" }),
        item({ subject: "cultivation", done: true, body: "旧修养" }),
      ],
      cursors,
    });
    const english = stayed.items.find((lesson) => lesson.subject === "english");
    const thai = stayed.items.find((lesson) => lesson.subject === "thai");
    const business = stayed.items.find((lesson) => lesson.subject === "business");
    const cultivation = stayed.items.find((lesson) => lesson.subject === "cultivation");
    expect(english).toMatchObject({ unit: 1, body: "旧英语", carryId: "english", minutes: 8 });
    expect(stayed.cursors.english).toBe(0);
    expect(thai).toMatchObject({ unit: 2, body: "", carryId: null, minutes: 8 });
    expect(stayed.cursors.thai).toBe(1);
    expect(business).toMatchObject({ body: "旧商业", carryId: "business", minutes: 8 });
    expect(cultivation).toMatchObject({ body: "", carryId: null, minutes: 6 });
    expect(needsModel(english!)).toBe(false);
    expect(needsModel(thai!)).toBe(true);
  });
});

describe("today and lesson shape", () => {
  it("creates four lessons on first open and checks the required markers", () => {
    const created = ensureToday({ today: "2026-11-18", existing: [], cursors: initialCursors() });
    expect(created?.map((lesson) => [lesson.subject, lesson.minutes, lesson.unit])).toEqual([
      ["business", 8, null],
      ["english", 8, 1],
      ["thai", 8, 1],
      ["cultivation", 6, null],
    ]);
    expect(ensureToday({ today: "2026-11-18", existing: [item({ subject: "english", done: false })], cursors: initialCursors() })).toBeNull();
    expect(lessonIsUsable("english", "场景：请假\n对话：I need to step out this afternoon.\n今天说：我今天会说的一句")).toBe(true);
    expect(lessonIsUsable("english", "只有一段阅读")).toBe(false);
    const oneThai = "泰文：ก\n读音：ko\n声调：中\n中文：鸡";
    const sixThai = Array.from({ length: 6 }, () => oneThai).join("\n");
    expect(lessonIsUsable("thai", sixThai)).toBe(true);
    expect(lessonIsUsable("thai", oneThai)).toBe(false);
    expect(lessonIsUsable("thai", "泰文：ก")).toBe(false);
    expect(fallbackLesson("thai")).toBe("今晚这门没写成，明天会再写。");
    expect(buildLessonMessages({ subject: "english", minutes: 8, title: "", body: "", unit: 2, carryId: null }, { english: 1, thai: 0 })[0].content).toContain("日常使用");
    const thaiPrompt = buildLessonMessages({ subject: "thai", minutes: 8, title: "", body: "", unit: 1, carryId: null }, initialCursors())[0].content;
    expect(thaiPrompt).toContain("字母和读音");
    expect(thaiPrompt).toContain("每单元6个");
  });
});
