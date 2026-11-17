import { describe, expect, it } from "vitest";
import { buildPolishMessages, fragmentBlock, PENDING_POLISH } from "../src/lib/polish";
import type { Fragment } from "../src/domain/types";

const photoOnly: Fragment = {
  id: "p",
  day: "2026-11-18",
  createdAt: "2026-11-18T01:12:00.000Z",
  body: "",
  media: [{ id: "m", kind: "photo", byteSize: 100 }],
};

describe("photo without caption does not invent a scene", () => {
  it("uses the fixed photo line and forbids describing the picture", () => {
    expect(PENDING_POLISH).toBe("今晚会收成一篇");
    expect(fragmentBlock(photoOnly)).toBe("09:12 这个时间加了一张照片");
    const messages = buildPolishMessages("2026-11-18", [
      photoOnly,
      {
        id: "t",
        day: "2026-11-18",
        createdAt: "2026-11-18T06:03:00.000Z",
        body: "看了一章商业",
        media: [{ id: "v", kind: "video", byteSize: 100 }],
      },
    ]);
    expect(messages[0].role).toBe("system");
    for (const line of ["保留本人的用词和具体细节", "把零碎句子补顺", "按时间排列", "不编写没有记过的事", "不描述照片或视频里的画面"]) {
      expect(messages[0].content).toContain(line);
    }
    expect(messages[1].content.indexOf("09:12 这个时间加了一张照片")).toBeLessThan(
      messages[1].content.indexOf("看了一章商业"),
    );
    expect(messages[1].content).toContain("14:03 这个时间加了一段视频");
    expect(messages[1].content).not.toContain("画面");
  });
});
