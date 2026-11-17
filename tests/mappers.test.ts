import { describe, expect, it } from "vitest";
import { toCursors, toDiary, toFragment, toStudyItem } from "../src/db/mappers";

describe("mappers", () => {
  it("keeps polished text attached to the original fragments", () => {
    const fragment = toFragment(
      { id: "f", day: "2026-11-18", createdAt: new Date("2026-11-18T01:00:00.000Z"), body: "晨跑" },
      [{ id: "m", kind: "photo", byteSize: 12 }],
    );
    const diary = toDiary(
      "2026-11-18",
      { polishedBody: "今天早上跑了。", polishedAt: new Date("2026-11-18T15:10:00.000Z") },
      [fragment],
    );
    expect(diary.polishedBody).toBe("今天早上跑了。");
    expect(diary.fragments[0].body).toBe("晨跑");
    expect(diary.fragments[0].media[0].kind).toBe("photo");
    expect(toStudyItem({
      id: "e",
      day: "2026-11-18",
      subject: "english",
      minutes: 8,
      title: "请假",
      body: "场景：请假\n对话：I need to step out.\n今天说：一句",
      done: false,
      unit: 1,
    }).subject).toBe("english");
    expect(toCursors([{ subject: "english", unit: 2 }, { subject: "thai", unit: 0 }])).toEqual({ english: 2, thai: 0 });
  });
});
