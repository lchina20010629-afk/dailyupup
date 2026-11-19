import { describe, expect, it } from "vitest";
import {
  answerIsUsable,
  askDiaryBody,
  askMessages,
  isBlankQuestion,
  keepAsk,
  threadItems,
  type Ask,
} from "../src/lib/asks";
import type { Fragment } from "../src/domain/types";

function ask(partial: Partial<Ask> = {}): Ask {
  return {
    id: "a1",
    day: "2026-11-18",
    createdAt: "2026-11-18T04:00:00.000Z",
    question: "面汤怎么少放盐",
    answer: "少放盐，下午多喝水",
    fragmentId: null,
    ...partial,
  };
}

function note(id: string, createdAt: string): Fragment {
  return { id, day: "2026-11-18", createdAt, body: "今天午饭好吃吗", media: [] };
}

describe("asks", () => {
  it("a life note is not an ask", () => {
    expect(isBlankQuestion("今天午饭好吃吗")).toBe(false);
  });

  it("keeping twice reuses the fragment", () => {
    const kept = ask({ fragmentId: "f1" });
    expect(keepAsk(kept, "f2")).toBe(kept);
  });

  it("a kept ask is not shown twice", () => {
    const items = threadItems([note("f1", "2026-11-18T04:00:00.000Z")], [ask({ fragmentId: "f1" })]);
    expect(items).toEqual([{ kind: "ask", ask: ask({ fragmentId: "f1" }) }]);
  });

  it("blank question is empty", () => {
    expect(isBlankQuestion("  ")).toBe(true);
  });

  it("a blank answer is unusable", () => {
    expect(answerIsUsable("  ")).toBe(false);
    expect(answerIsUsable("少放盐")).toBe(true);
  });

  it("writes the diary line and the answer prompt", () => {
    expect(askDiaryBody({ question: "面汤怎么少放盐", answer: "少放盐，下午多喝水" })).toBe(
      "问：面汤怎么少放盐\n答：少放盐，下午多喝水",
    );
    expect(askMessages("面汤")[0].content).toContain("不要写成日记");
    expect(askMessages("面汤")[0].content).toContain("最多四句");
  });
});
