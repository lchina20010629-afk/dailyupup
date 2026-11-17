// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { appendFragment } from "../src/lib/fragments";
import { showInstallHint } from "../src/lib/installHint";
import { buildManifest } from "../src/lib/manifest";
import { TabBar } from "../src/components/TabBar";
import { StudyList } from "../src/components/StudyList";
import { Composer } from "../src/components/Composer";

describe("shell", () => {
  it("offers three client links, a standalone manifest, and the 30-minute lessons", () => {
    expect(showInstallHint({ standalone: false, dismissed: false })).toBe(true);
    expect(showInstallHint({ standalone: true, dismissed: false })).toBe(false);
    expect(showInstallHint({ standalone: false, dismissed: true })).toBe(false);
    expect(buildManifest()).toMatchObject({
      name: "日常记录",
      display: "standalone",
      start_url: "/today",
      lang: "zh-CN",
    });
    render(<TabBar />);
    expect(screen.getByRole("link", { name: "今天" }).getAttribute("href")).toBe("/today");
    expect(screen.getByRole("link", { name: "日记" }).getAttribute("href")).toBe("/diary");
    expect(screen.getByRole("link", { name: "学习" }).getAttribute("href")).toBe("/study");
    render(
      <StudyList
        items={[
          { id: "b", day: "2026-11-18", subject: "business", minutes: 8, title: "定价", body: "三行概念", done: false, unit: null },
          { id: "e", day: "2026-11-18", subject: "english", minutes: 8, title: "请假", body: "场景：请假\n对话：I need to step out.\n今天说：一句", done: false, unit: 1 },
          { id: "t", day: "2026-11-18", subject: "thai", minutes: 8, title: "字母", body: "泰文：ก\n读音：ko\n声调：中\n中文：鸡", done: false, unit: 1 },
          { id: "c", day: "2026-11-18", subject: "cultivation", minutes: 6, title: "倾听", body: "一个做法", done: false, unit: null },
        ]}
      />,
    );
    expect(screen.getByText("约 30 分钟")).toBeTruthy();
    expect(screen.getByText("商业 · 8 分钟")).toBeTruthy();
    expect(screen.getByText("英语 · 8 分钟")).toBeTruthy();
    expect(screen.getByText("泰语 · 8 分钟")).toBeTruthy();
    expect(screen.getByText("修养 · 6 分钟")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "读完" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "说完" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "跟读" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "记住" })).toBeTruthy();
  });

  it("shows a new note immediately in time order", () => {
    const next = appendFragment(
      [{ id: "a", day: "2026-11-18", createdAt: "2026-11-18T02:00:00.000Z", body: "后", media: [] }],
      { id: "b", day: "2026-11-18", createdAt: "2026-11-18T01:00:00.000Z", body: "先", media: [] },
    );
    expect(next.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("lets today's note be edited or deleted before the night polish", () => {
    render(
      <Composer
        initial={[{ id: "a", day: "2026-11-18", createdAt: "2026-11-18T01:00:00.000Z", body: "晨跑", media: [] }]}
      />,
    );
    expect(screen.getByRole("button", { name: "改" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "删" })).toBeTruthy();
  });
});
