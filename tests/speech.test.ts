import { describe, expect, it } from "vitest";
import { lessonLines, speakableLines } from "../src/lib/speech";

describe("speakable lines", () => {
  it("reads each English sentence and the Thai line, skipping the Chinese labels", () => {
    expect(
      speakableLines(
        "english",
        "场景：请假\n对话：I need to step out. See you later.\n今天说：一句",
      ),
    ).toEqual(["I need to step out.", "See you later."]);
    expect(speakableLines("thai", "单元 1，8 分钟。\n泰文：ก ข\n读音：ko\n声调：中\n中文：鸡")).toEqual(["ก ข"]);
    expect(lessonLines("thai", "单元 1，8 分钟。\n泰文：ก\n读音：ko").map((line) => line.text)).toEqual(["泰文：ก", "读音：ko"]);
    expect(speakableLines("english", "场景：没有英文")).toEqual([]);
    expect(speakableLines("english", "You: Morning, Anna! Welcome back.")).toEqual([
      "Morning, Anna!",
      "Welcome back.",
    ]);
    expect(speakableLines("english", "\"Welcome back\" — 同事休假回来最常用的开场白。")).toEqual([]);
  });
});
