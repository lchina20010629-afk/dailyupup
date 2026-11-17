# 日常记录 PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一个只给本人用的 PWA：白天记下文字、照片和视频，夜里收成仍像本人说话的日记，并给出第二天能在 30 分钟内做完的四门学习。

**Architecture:** Next.js 16.4.6 App Router 负责页面和接口。日历、登录门、记录规则、整理稿和课程进度都是纯函数，测试不连外部服务。Postgres 只存文字和进度，照片视频经预签名直传私有 R2。Vercel 每日定时任务先补写整理稿，再写下一天的学习。

**Tech Stack:** Next.js 16.4.6、React 19.3.1、TypeScript、Vitest 5.1.0、Drizzle ORM 0.45.4、`@neondatabase/serverless` 1.2.1、`@aws-sdk/client-s3` 与 `@aws-sdk/s3-request-presigner` 3.1170.0、Zod 4.6.7

**Spec:** `docs/superpowers/specs/2026-11-18-daily-record-pwa-design.md`

## Global Constraints

- Next.js 精确版本 `16.4.6`，React 与 React DOM `19.3.1`，App Router。路由保护用 `src/proxy.ts` 导出 `proxy`，不用 `middleware.ts`。
- 界面中文。一天的边界是 `Asia/Shanghai`。定时表达式是 `0 15 * * *`（上海时间 23:00 那一小时内触发）。Cron 路由 `export const maxDuration = 300`。
- 底部三个入口：今天、日记、学习。用 `next/link` 切换，不整页刷新。记一条后列表里马上出现。
- 媒体不进 Vercel 函数体。浏览器直传 R2。图片上传前最长边压到 1600。单条视频上限 `209715200` 字节（200MB）。桶私有，阅读用短期签名。页面用 `<img>` 和 `<video>`，不用 `next/image`。
- 模型只在服务器调用 DeepSeek `deepseek-chat`。整理保留用词和细节，补顺句子，按时间排列，不编写没记过的事，不描述画面。
- 四门分钟数固定：商业 8、英语 8、泰语 8、修养 6。页面写「约 30 分钟」。英语按四级，正文必须含 `改一句：` 和 `搭配：`。泰语正文必须含 `泰文：`、`读音：`、`声调：`、`中文：`。不生成语音，不发推送。
- 英语和泰语只有上一份已勾选才把进度加一。商业和修养勾完才换新的，没勾完就原样带到下一天。第一次打开、当天没有课时，立刻生成当天四门。
- 当天整理稿写成之后，原文不能再改、不能再删。整理稿不因事后改原文而重写。没有文字的照片写成「这个时间加了一张照片」，视频写成「这个时间加了一段视频」。
- 登录密码放在 `APP_PASSWORD`，比较前两边都做 SHA-256，再用 `timingSafeEqual`。会话 cookie 名 `dr_session`，HttpOnly，SameSite=Lax，30 天。
- 必填环境变量：`APP_PASSWORD`、`SESSION_SECRET`、`DATABASE_URL`、`DEEPSEEK_API_KEY`、`CRON_SECRET`、`R2_ACCOUNT_ID`、`R2_BUCKET`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_ENDPOINT`。`CRON_SECRET` 是这项计划加上的：定时地址在公网，没有它任何人都能触发模型。缺任何一项时，页面列出缺的名字。
- 目录里已有 `docs/` 和 `.agents/`。脚手架不得删掉它们。

## Review Focus

- 只有照片或视频、没有文字时，交给模型的文字只能是「这个时间加了一张照片」或「这个时间加了一段视频」，系统提示里禁止描述画面。测试：`tests/polish.test.ts` 的 `photo without caption does not invent a scene`。
- 上海时间跨过午夜才换一天；UTC 15:00 仍属于当天，夜里的整理写的是这一天。测试：`tests/time.test.ts` 的 `shanghai day boundary`。
- 英语没勾选时单元号和进度都不变；勾选后进度加一，下一课单元是旧单元加一。测试：`tests/study.test.ts` 的 `english cursor`。
- 整理稿已经写上之后，删除和修改都被拒绝，整理稿原文保持不动。测试：`tests/fragments.test.ts` 的 `locked after polish`。
- 空记录和超过 200MB 的视频不能保存。测试：`tests/fragments.test.ts` 的 `reject empty and oversized video`。

---

### Task 1: 项目骨架和上海日历

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/lib/time.ts`
- Test: `tests/time.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `shanghaiDate(now: Date): string`，格式 `YYYY-MM-DD`；`shanghaiClock(now: Date): string`，格式 `HH:mm`；`addShanghaiDays(day: string, days: number): string`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { addShanghaiDays, shanghaiClock, shanghaiDate } from "../src/lib/time";

describe("shanghai day boundary", () => {
  it("keeps 23:59 and the 23:00 cron instant on the same Shanghai day", () => {
    expect(shanghaiDate(new Date("2026-11-17T15:59:59.000Z"))).toBe("2026-11-17");
    expect(shanghaiClock(new Date("2026-11-17T15:59:59.000Z"))).toBe("23:59");
    expect(shanghaiDate(new Date("2026-11-18T15:00:00.000Z"))).toBe("2026-11-18");
    expect(shanghaiDate(new Date("2026-11-17T16:00:00.000Z"))).toBe("2026-11-18");
    expect(shanghaiClock(new Date("2026-11-17T16:00:00.000Z"))).toBe("00:00");
  });

  it("rolls the calendar across a month end", () => {
    expect(addShanghaiDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/time.test.ts`

Expected: FAIL，`../src/lib/time` 不存在

- [ ] **Step 3: 建立 Next.js 16.4.6 工程并实现 `src/lib/time.ts`**

在现有仓库根目录安装，不要清空目录。`package.json` 的 `dependencies` 固定为 `next@16.4.6`、`react@19.3.1`、`react-dom@19.3.1`。开发依赖含 `typescript`、`@types/react`、`@types/react-dom`、`@types/node`、`vitest@5.1.0`。脚本：`dev` = `next dev`，`build` = `next build`，`test` = `vitest run`。

`vitest.config.ts` 使用 `node` 环境，包含 `tests/**/*.test.ts`。`src/app/page.tsx` 先只渲染「日常记录」。`shanghaiDate` 和 `shanghaiClock` 用 `Intl.DateTimeFormat`，时区 `Asia/Shanghai`。`addShanghaiDays` 以该日正午的 UTC 时刻加天数，再格式化回上海日期，避免午夜附近加减出错。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/time.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts src tests
git commit -m "$(cat <<'EOF'
feat: scaffold Next.js 16.4.6 and Shanghai dates

EOF
)"
```

### Task 2: 环境变量清单和登录门

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/auth.ts`
- Create: `src/proxy.ts`
- Create: `.env.example`
- Test: `tests/env.test.ts`
- Test: `tests/auth.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `REQUIRED_ENV`：上面 Global Constraints 里的 10 个名字，顺序相同
  - `missingEnv(source: Record<string, string | undefined>): string[]`
  - `passwordsMatch(input: string, expected: string): boolean`
  - `signSession(secret: string, exp: number): string`
  - `verifySession(secret: string, token: string, nowSeconds: number): boolean`
  - `sessionCookie(token: string, secure: boolean): { name: "dr_session"; value: string; httpOnly: true; sameSite: "lax"; path: "/"; secure: boolean; maxAge: 2592000 }`
  - `pageGate(pathname: string, hasSession: boolean): "allow" | "to-login" | "to-today"`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { missingEnv, REQUIRED_ENV } from "../src/lib/env";
import { pageGate, passwordsMatch, sessionCookie, signSession, verifySession } from "../src/lib/auth";

describe("required env", () => {
  it("names every missing key and ignores present ones", () => {
    expect(REQUIRED_ENV).toEqual([
      "APP_PASSWORD",
      "SESSION_SECRET",
      "DATABASE_URL",
      "DEEPSEEK_API_KEY",
      "CRON_SECRET",
      "R2_ACCOUNT_ID",
      "R2_BUCKET",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_ENDPOINT",
    ]);
    const source = Object.fromEntries(REQUIRED_ENV.map((key) => [key, "x"]));
    delete source.DEEPSEEK_API_KEY;
    delete source.R2_BUCKET;
    expect(missingEnv(source)).toEqual(["DEEPSEEK_API_KEY", "R2_BUCKET"]);
  });
});

describe("session gate", () => {
  it("accepts the password, rejects a different one, and sets an HttpOnly cookie", () => {
    expect(passwordsMatch("correct horse", "correct horse")).toBe(true);
    expect(passwordsMatch("nope", "correct horse")).toBe(false);
    expect(passwordsMatch("correct horse!", "correct horse")).toBe(false);
    const cookie = sessionCookie("token", true);
    expect(cookie).toMatchObject({ name: "dr_session", httpOnly: true, sameSite: "lax", path: "/", secure: true, maxAge: 2592000 });
  });

  it("rejects a tampered or expired token", () => {
    const token = signSession("secret", 2_000);
    expect(verifySession("secret", token, 1_000)).toBe(true);
    expect(verifySession("secret", token, 2_000)).toBe(false);
    expect(verifySession("other", token, 1_000)).toBe(false);
    expect(verifySession("secret", `${token}x`, 1_000)).toBe(false);
  });

  it("sends private pages to login and logged-in visitors away from login", () => {
    expect(pageGate("/today", false)).toBe("to-login");
    expect(pageGate("/diary/2026-11-18", false)).toBe("to-login");
    expect(pageGate("/study", false)).toBe("to-login");
    expect(pageGate("/login", false)).toBe("allow");
    expect(pageGate("/login", true)).toBe("to-today");
    expect(pageGate("/today", true)).toBe("allow");
    expect(pageGate("/api/cron/nightly", false)).toBe("allow");
    expect(pageGate("/api/login", false)).toBe("allow");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/env.test.ts tests/auth.test.ts`

Expected: FAIL，模块不存在

- [ ] **Step 3: 实现 `missingEnv`、会话和 `pageGate`**

`passwordsMatch` 对两边 UTF-8 做 SHA-256，再 `timingSafeEqual`。`signSession` 的载荷是 `exp` 的十进制字符串，签名是 HMAC-SHA256，令牌格式 `exp.hex`。`verifySession` 在 `nowSeconds >= exp` 时返回 false。

`pageGate`：路径以 `/api/cron` 或 `/api/login` 开头则 `allow`；`/login` 在已登录时 `to-today`，否则 `allow`；`/today`、`/diary`、`/study` 以及 `/` 在未登录时 `to-login`，已登录的 `/` 为 `to-today`。`src/proxy.ts` 只调用 `pageGate` 和 `verifySession`，不访问数据库。`.env.example` 列出 `REQUIRED_ENV`，值为空。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/env.test.ts tests/auth.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/auth.ts src/proxy.ts .env.example tests/env.test.ts tests/auth.test.ts
git commit -m "$(cat <<'EOF'
feat: add env report and session gate

EOF
)"
```

### Task 3: 记录规则和媒体限制

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/lib/fragments.ts`
- Test: `tests/fragments.test.ts`

**Interfaces:**
- Consumes: `shanghaiClock`
- Produces:

```ts
export type MediaKind = "photo" | "video";
export type Fragment = {
  id: string;
  day: string;
  createdAt: string;
  body: string;
  media: { id: string; kind: MediaKind; byteSize: number }[];
};
export type DiaryDay = {
  day: string;
  polishedBody: string | null;
  polishedAt: string | null;
  fragments: Fragment[];
};

export function assertCanSave(input: { body: string; media: { kind: MediaKind; byteSize: number }[] }): "ok" | "empty" | "too-big";
export function canMutate(polishedAt: string | null): boolean;
export function sortedFragments(items: Fragment[]): Fragment[];
export function targetImageSize(width: number, height: number, maxEdge?: number): { width: number; height: number };
export const VIDEO_MAX_BYTES: number;
```

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/fragments.test.ts`

Expected: FAIL，模块不存在

- [ ] **Step 3: 实现 `src/domain/types.ts` 和 `src/lib/fragments.ts`**

`assertCanSave`：去掉正文空白后长度为 0 且没有媒体时返回 `empty`；任一视频 `byteSize > VIDEO_MAX_BYTES` 时返回 `too-big`；否则 `ok`。`canMutate` 仅在 `polishedAt === null` 时为 true。`sortedFragments` 按 `createdAt` 升序，不改原数组。`targetImageSize` 默认 `maxEdge` 为 1600，长边不超过它，另一边按比例取整，已经更小则原样返回。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/fragments.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/lib/fragments.ts tests/fragments.test.ts
git commit -m "$(cat <<'EOF'
feat: add fragment and media rules

EOF
)"
```

### Task 4: 整理稿的输入

**Files:**
- Create: `src/lib/polish.ts`
- Test: `tests/polish.test.ts`

**Interfaces:**
- Consumes: `Fragment`，`shanghaiClock`
- Produces:
  - `PENDING_POLISH = "今晚会收成一篇"`
  - `fragmentBlock(fragment: Fragment): string`
  - `buildPolishMessages(day: string, fragments: Fragment[]): { role: "system" | "user"; content: string }[]`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/polish.test.ts`

Expected: FAIL，模块不存在

- [ ] **Step 3: 实现 `fragmentBlock` 和 `buildPolishMessages`**

`fragmentBlock` 用 `shanghaiClock(new Date(fragment.createdAt))` 作时间。没有正文的照片只输出 `${HH:mm} 这个时间加了一张照片`，视频只输出 `${HH:mm} 这个时间加了一段视频`。有正文时先写正文，每种媒体再各占一行。`buildPolishMessages` 先按 `createdAt` 排序。系统提示包含测试里的五句，并写明输出就是日记正文，不要标题。用户消息是这些块，中间空一行。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/polish.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/polish.ts tests/polish.test.ts
git commit -m "$(cat <<'EOF'
feat: build the nightly polish prompt

EOF
)"
```

### Task 5: 四门学习的进度

**Files:**
- Create: `src/lib/study.ts`
- Test: `tests/study.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:

```ts
export type Subject = "business" | "english" | "thai" | "cultivation";
export type StudyItem = {
  id: string;
  day: string;
  subject: Subject;
  minutes: number;
  title: string;
  body: string;
  done: boolean;
  unit: number | null;
};
export type Cursors = { english: number; thai: number };
export type LessonDraft = {
  subject: Subject;
  minutes: number;
  title: string;
  body: string;
  unit: number | null;
  carryId: string | null;
};

export const SUBJECT_MINUTES: Record<Subject, number>;
export function initialCursors(): Cursors;
export function ensureToday(input: { today: string; existing: StudyItem[]; cursors: Cursors }): LessonDraft[] | null;
export function tomorrowsPlan(input: { nextDay: string; todayItems: StudyItem[]; cursors: Cursors }): { items: LessonDraft[]; cursors: Cursors };
export function needsModel(draft: LessonDraft): boolean;
export function lessonIsUsable(subject: Subject, body: string): boolean;
export function fallbackLesson(subject: Subject): string;
export function buildLessonMessages(draft: LessonDraft, cursors: Cursors): { role: "system" | "user"; content: string }[];
```

- [ ] **Step 1: Write the failing test**

```ts
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
    expect(lessonIsUsable("english", "短文\n改一句：x\n搭配：y")).toBe(true);
    expect(lessonIsUsable("english", "只有短文")).toBe(false);
    expect(lessonIsUsable("thai", "泰文：ก\n读音：ko\n声调：中\n中文：鸡")).toBe(true);
    expect(lessonIsUsable("thai", "泰文：ก")).toBe(false);
    expect(fallbackLesson("thai")).toBe("今晚这门没写成，明天会再写。");
    expect(buildLessonMessages({ subject: "english", minutes: 8, title: "", body: "", unit: 2, carryId: null }, { english: 1, thai: 0 })[0].content).toContain("大学英语四级");
    expect(buildLessonMessages({ subject: "thai", minutes: 8, title: "", body: "", unit: 1, carryId: null }, initialCursors())[0].content).toContain("字母和读音");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/study.test.ts`

Expected: FAIL，模块不存在

- [ ] **Step 3: 实现 `src/lib/study.ts`**

`ensureToday` 在 `existing.length > 0` 时返回 `null`。否则按商业、英语、泰语、修养返回四条：`title` 和 `body` 为空，`carryId` 为 `null`，英语和泰语的 `unit` 为对应进度加一，进度值本身不改。

`tomorrowsPlan` 的 `items` 顺序同上。英语或泰语未完成：复制 `title`、`body`、`unit`，`carryId` 为当天条目的 `id`，进度不变。已完成：`unit` 为当天 `unit + 1`，`body` 和 `title` 为空，`carryId` 为 `null`，进度设为当天的 `unit`。商业和修养未完成时同样复制；完成时 `body` 和 `title` 为空，`carryId` 为 `null`，`unit` 为 `null`。当天缺少某门时，按「未学过」生成一条新的空正文，英语和泰语单元为进度加一，进度不变。

`needsModel` 为 `carryId === null`。`lessonIsUsable`：英语必须同时含 `改一句：` 和 `搭配：`；泰语必须同时含 `泰文：`、`读音：`、`声调：`、`中文：`；商业和修养的正文去掉空白后至少 20 个字符。`fallbackLesson` 对四门都返回 `今晚这门没写成，明天会再写。`

`buildLessonMessages` 的系统提示按科目写死要求：商业是一个概念、三到五行；英语是大学英语四级、一篇短文，并要求正文包含 `改一句：` 和 `搭配：`；泰语从字母和读音开始、单元号连续，并要求四个标记；修养是一个职场里用得上的做法。用户消息写明单元号和分钟数。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/study.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/study.ts tests/study.test.ts
git commit -m "$(cat <<'EOF'
feat: add the 30-minute study progress rules

EOF
)"
```

### Task 6: 夜里的顺序

**Files:**
- Create: `src/lib/nightly.ts`
- Create: `src/lib/deepseek.ts`
- Test: `tests/nightly.test.ts`

**Interfaces:**
- Consumes: `shanghaiDate`，`addShanghaiDays`，`buildPolishMessages`，`tomorrowsPlan`，`needsModel`，`lessonIsUsable`，`fallbackLesson`，`buildLessonMessages`，`Fragment`，`StudyItem`，`Cursors`，`LessonDraft`
- Produces:

```ts
export function chatMessagesBody(model: "deepseek-chat", messages: { role: "system" | "user"; content: string }[]): string;

export type NightlyDeps = {
  now: Date;
  loadUnpolished: (oldestDay: string, today: string) => Promise<{ day: string; fragments: Fragment[] }[]>;
  savePolish: (day: string, body: string, polishedAt: string) => Promise<void>;
  loadStudy: (day: string) => Promise<StudyItem[]>;
  loadCursors: () => Promise<Cursors>;
  saveCursors: (cursors: Cursors) => Promise<void>;
  saveLessons: (day: string, items: LessonDraft[]) => Promise<void>;
  chat: (messages: { role: "system" | "user"; content: string }[]) => Promise<string>;
};

export async function runNightly(deps: NightlyDeps): Promise<{ polishedDays: string[]; studyDay: string }>;
```

- [ ] **Step 1: Write the failing test**

```ts
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
        if (messages[0].content.includes("大学英语四级")) return "短文\n改一句：a\n搭配：b";
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/nightly.test.ts`

Expected: FAIL，模块不存在

- [ ] **Step 3: 实现 `runNightly`**

`chatMessagesBody` 返回 JSON 字符串，含 `model` 和 `messages`。`runNightly`：`today = shanghaiDate(now)`，`studyDay = addShanghaiDays(today, 1)`，`oldestDay = addShanghaiDays(today, -6)`。向 `loadUnpolished` 要这个闭区间。返回列表按日期从早到晚取前 2 天。每一天先 `chat(buildPolishMessages(...))`，再 `savePolish`，`polishedAt` 用 `now.toISOString()`。全部整理完成后再读当天学习和进度，调用 `tomorrowsPlan`。只对 `needsModel` 的草稿调用 `chat(buildLessonMessages(...))`。可用则把模型原文写入 `body`；不可用则写入 `fallbackLesson`，并且若科目是英语或泰语，把该科进度改回 `loadCursors` 读到的原值，`unit` 改回原进度加一。然后 `saveLessons`、`saveCursors`。模型调用失败时视同不可用，不抛出到定时任务外面。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/nightly.test.ts`

Expected: PASS。若进度断言和「先整理、再学习」的调用顺序对不上，改实现，不改这个测试的期望。

- [ ] **Step 5: Commit**

```bash
git add src/lib/nightly.ts src/lib/deepseek.ts tests/nightly.test.ts
git commit -m "$(cat <<'EOF'
feat: run polish before the next study plan

EOF
)"
```

### Task 7: 表结构和映射

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/mappers.ts`
- Create: `drizzle.config.ts`
- Test: `tests/mappers.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `Fragment`，`DiaryDay`，`StudyItem`，`Cursors`
- Produces: Drizzle 表 `fragments`、`media`、`diaryDays`、`studyItems`、`studyCursors`；`toFragment(row, mediaRows)`；`toDiary(day, polished, fragments)`；`toStudyItem(row)`；`toCursors(rows)`

- [ ] **Step 1: Write the failing test**

```ts
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
      id: "e", day: "2026-11-18", subject: "english", minutes: 8, title: "四级", body: "正文", done: false, unit: 1,
    }).subject).toBe("english");
    expect(toCursors([{ subject: "english", unit: 2 }, { subject: "thai", unit: 0 }])).toEqual({ english: 2, thai: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mappers.test.ts`

Expected: FAIL，模块不存在

- [ ] **Step 3: 定义表和映射**

安装 `drizzle-orm@0.45.4`、`@neondatabase/serverless@1.2.1`、`drizzle-kit@0.31.11`、`zod@4.6.7`。表列：`fragments(id, day, createdAt, body)`；`media(id, fragmentId, kind, r2Key, contentType, byteSize)`；`diaryDays(day 主键, polishedBody, polishedAt)`；`studyItems(id, day, subject, minutes, title, body, done, unit)`；`studyCursors(subject 主键, unit)`。映射只做字段改名和日期转 ISO 字符串，不写查询。`drizzle.config.ts` 读取 `DATABASE_URL`。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mappers.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db drizzle.config.ts package.json package-lock.json tests/mappers.test.ts
git commit -m "$(cat <<'EOF'
feat: add diary tables and row mappers

EOF
)"
```

### Task 8: 登录、记录和定时接口

**Files:**
- Create: `src/lib/cronAuth.ts`
- Create: `src/lib/r2.ts`
- Create: `src/db/repository.ts`
- Create: `src/app/api/login/route.ts`
- Create: `src/app/api/logout/route.ts`
- Create: `src/app/api/fragments/route.ts`
- Create: `src/app/api/fragments/[id]/route.ts`
- Create: `src/app/api/cron/nightly/route.ts`
- Create: `vercel.json`
- Test: `tests/cronAuth.test.ts`

**Interfaces:**
- Consumes: `passwordsMatch`，`signSession`，`sessionCookie`，`verifySession`，`assertCanSave`，`canMutate`，`runNightly`
- Produces: `cronAuthorized(header: string | null, secret: string): boolean`。`POST /api/login` 接受 `{ password: string }`。`POST /api/fragments` 接受 `{ body: string; media: { kind: "photo" | "video"; contentType: string; byteSize: number }[] }`。`PATCH` 和 `DELETE /api/fragments/:id`。`POST /api/cron/nightly` 无正文。

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { cronAuthorized } from "../src/lib/cronAuth";

describe("cron authorization", () => {
  it("accepts only the exact bearer secret", () => {
    expect(cronAuthorized("Bearer night-key", "night-key")).toBe(true);
    expect(cronAuthorized("Bearer night-key ", "night-key")).toBe(false);
    expect(cronAuthorized(null, "night-key")).toBe(false);
    expect(cronAuthorized("Bearer other", "night-key")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cronAuth.test.ts`

Expected: FAIL，模块不存在

- [ ] **Step 3: 实现鉴权函数和路由**

`cronAuthorized` 去掉前缀 `Bearer ` 后，对密钥和提供值做 SHA-256 再 `timingSafeEqual`。登录成功写 `sessionCookie`，失败返回 401。记录接口先 `verifySession`，失败返回 401。`assertCanSave` 不是 `ok` 时返回 400。`canMutate` 为 false 时 `PATCH` 和 `DELETE` 返回 409，且不更新 `diaryDays`。定时路由未通过 `cronAuthorized` 时返回 401；通过则调用 `runNightly`，并 `export const maxDuration = 300`。`vercel.json` 为 `{ "crons": [{ "path": "/api/cron/nightly", "schedule": "0 15 * * *" }] }`。这一步的数据库和 R2 调用可以先放在 `src/db/repository.ts` 和 `src/lib/r2.ts`，签名 URL 的有效期 10 分钟；没有配置时这些函数抛出带缺失变量名的错误，由路由变成 500 和那段文字。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cronAuth.test.ts tests/fragments.test.ts tests/auth.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/cronAuth.ts src/lib/r2.ts src/db/repository.ts src/app/api vercel.json tests/cronAuth.test.ts
git commit -m "$(cat <<'EOF'
feat: add login, fragment, and nightly routes

EOF
)"
```

### Task 9: 三个页面和可安装外壳

**Files:**
- Create: `src/lib/manifest.ts`
- Create: `src/lib/installHint.ts`
- Create: `src/app/manifest.ts`
- Create: `src/app/icons/[size]/route.tsx`
- Create: `src/components/TabBar.tsx`
- Create: `src/components/Composer.tsx`
- Create: `src/components/InstallHint.tsx`
- Create: `src/components/StudyList.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/(shell)/layout.tsx`
- Create: `src/app/(shell)/today/page.tsx`
- Create: `src/app/(shell)/diary/page.tsx`
- Create: `src/app/(shell)/diary/[date]/page.tsx`
- Create: `src/app/(shell)/study/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/lib/fragments.ts`
- Modify: `vitest.config.ts`
- Test: `tests/shell.test.tsx`

**Interfaces:**
- Consumes: `pageGate`，`missingEnv`，`PENDING_POLISH`，`SUBJECT_MINUTES`，`ensureToday`，`Fragment`，`StudyItem`
- Produces:
  - `showInstallHint(input: { standalone: boolean; dismissed: boolean }): boolean`
  - `buildManifest(): { name: "日常记录"; short_name: "日常"; display: "standalone"; start_url: "/today"; lang: "zh-CN"; icons: { src: string; sizes: "192x192" | "512x512"; type: "image/png" }[] }`
  - `appendFragment(items: Fragment[], item: Fragment): Fragment[]`，定义在 `src/lib/fragments.ts`，按 `createdAt` 升序返回新数组

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { appendFragment } from "../src/lib/fragments";
import { showInstallHint } from "../src/lib/installHint";
import { buildManifest } from "../src/lib/manifest";
import { TabBar } from "../src/components/TabBar";
import { StudyList } from "../src/components/StudyList";

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
          { id: "e", day: "2026-11-18", subject: "english", minutes: 8, title: "短文", body: "改一句：a\n搭配：b", done: false, unit: 1 },
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
    expect(screen.getByRole("checkbox", { name: "做完" })).toBeTruthy();
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shell.test.tsx`

Expected: FAIL，组件或 `@testing-library/react` 不存在

- [ ] **Step 3: 实现外壳、三页和清单**

安装 `@testing-library/react` 和 `jsdom` 的当前稳定版。`vitest.config.ts` 对 `tests/**/*.tsx` 使用 `jsdom`。`appendFragment` 返回按 `createdAt` 升序的新数组。`TabBar` 固定在底部，三个 `next/link`。`StudyList` 按商业、英语、泰语、修养显示分钟标题；勾选的可访问名称依次是「读完」「做完」「跟读」「记住」。学习页在当天没有课时调用 `ensureToday` 并保存。日记详情页在 `polishedBody === null` 时显示 `PENDING_POLISH`，其下渲染原文和媒体，不渲染四门课文。今天页的输入条固定在底部；图片先按 `targetImageSize` 缩小再上传，视频超过 `VIDEO_MAX_BYTES` 时在页面上说明而不上传。提交时先 `appendFragment` 再请求接口。`InstallHint` 在 `showInstallHint` 为真时说明 Safari「添加到主屏幕」，关掉后把 `dr-install-dismissed` 写入 `localStorage`。`buildManifest` 的图标指向 `/icons/192` 和 `/icons/512`。根布局使用浅色背景和一种强调色，安全区内边距留给底部导航。缺环境变量时，登录页列出 `missingEnv` 的结果，不渲染空白。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`

Expected: PASS，此前所有测试仍然通过

- [ ] **Step 5: Commit**

```bash
git add src tests vitest.config.ts package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: add the three-tab journal shell

EOF
)"
```
