import { describe, expect, it } from "vitest";
import { assertCanSave, canMutate, sortedFragments, targetImageSize, VIDEO_MAX_BYTES } from "../src/lib/fragments";

describe("reject empty and oversized video", () => {
  it("rejects a blank note and a video over 200MB", () => {
    expect(assertCanSave({ body: "   ", media: [] })).toBe("empty");
    expect(assertCanSave({ body: "", media: [{ kind: "photo", byteSize: 10 }] })).toBe("ok");
    expect(assertCanSave({ body: "晨跑", media: [] })).toBe("ok");
    expect(VIDEO_MAX_BYTES).toBe(209715200);
    expect(assertCanSave({ body: "", media: [{ kind: "video", byteSize: VIDEO_MAX_BYTES + 1 }] })).toBe("too-big");
    expect(assertCanSave({ body: "", media: [{ kind: "video", byteSize: VIDEO_MAX_BYTES }] })).toBe("ok");
  });
});

describe("locked after polish", () => {
  it("allows edits only before polishedAt and keeps sort order", () => {
    expect(canMutate(null)).toBe(true);
    expect(canMutate("2026-11-18T15:10:00.000Z")).toBe(false);
    const items = [
      { id: "b", day: "2026-11-18", createdAt: "2026-11-18T06:00:00.000Z", body: "后", media: [] },
      { id: "a", day: "2026-11-18", createdAt: "2026-11-18T01:00:00.000Z", body: "先", media: [] },
    ];
    expect(sortedFragments(items).map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("image edge", () => {
  it("shrinks the long edge to 1600 and leaves smaller images unchanged", () => {
    expect(targetImageSize(3200, 1600)).toEqual({ width: 1600, height: 800 });
    expect(targetImageSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
