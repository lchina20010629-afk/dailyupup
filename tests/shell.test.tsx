// @vitest-environment jsdom
import { ThemeProvider } from "@mui/material/styles";
import { THEMES } from "../src/lib/themes";

function ThemeWrap({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={THEMES.paper}>{children}</ThemeProvider>;
}
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});
import { appendFragment } from "../src/lib/fragments";
import { showInstallHint } from "../src/lib/installHint";
import { buildManifest } from "../src/lib/manifest";
import { TabBar } from "../src/components/TabBar";
import { SubjectNav } from "../src/components/SubjectNav";
import { LessonCard } from "../src/components/LessonCard";
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
    render(<TabBar />, { wrapper: ThemeWrap });
    expect(screen.getByRole("link", { name: "今天" }).getAttribute("href")).toBe("/today");
    expect(screen.getByRole("link", { name: "日记" }).getAttribute("href")).toBe("/diary");
    expect(screen.getByRole("link", { name: "学习" }).getAttribute("href")).toBe("/study");
    render(<SubjectNav current="english" />, { wrapper: ThemeWrap });
    expect(screen.getByRole("link", { name: "商业" }).getAttribute("href")).toBe("/study/business");
    expect(screen.getByRole("link", { name: "英语" }).getAttribute("href")).toBe("/study/english");
    expect(screen.getByRole("link", { name: "泰语" }).getAttribute("href")).toBe("/study/thai");
    expect(screen.getByRole("link", { name: "修身" }).getAttribute("href")).toBe("/study/cultivation");
    render(
      <ThemeWrap>
      <LessonCard
        item={{
          id: "e",
          day: "2026-11-18",
          subject: "english",
          minutes: 8,
          title: "请假",
          body: "场景：请假\n对话：I need to step out. See you later.\n今天说：一句",
          done: false,
          unit: 1,
        }}
      />
      </ThemeWrap>,
    );
    expect(screen.getByText("英语 · 8 分钟")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "读这句" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "全文朗读" })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "说完" })).toBeTruthy();
    expect(screen.queryByText("商业 · 8 分钟")).toBeNull();
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
      <ThemeWrap>
      <Composer
        initial={[{ id: "a", day: "2026-11-18", createdAt: "2026-11-18T01:00:00.000Z", body: "晨跑", media: [] }]}
      />
      </ThemeWrap>,
    );
    expect(screen.getByRole("button", { name: "记" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "问" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "改" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "删" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "语音" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "表情" })).toBeTruthy();
    expect(screen.getByLabelText("照片").hasAttribute("multiple")).toBe(true);
  });
});
