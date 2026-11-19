# 今天里提问 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「今天」的同一条对话里用「记 / 问」切换：记下的马上进入当晚日记，问到的回答只有点了「记进日记」才进入。

**Architecture:** 纯函数决定日记正文和对话里谁显示一次。`asks` 表保存问答；记进日记时写一条普通 `fragments` 记录，夜里的整理不用新路径。页面只把新问答插进当前列表。

**Tech Stack:** Next.js 16.4.6、React 19.3.1、TypeScript、Vitest 5.1.0、Drizzle ORM 0.45.4、DeepSeek `deepseek-chat`

**Spec:** `docs/superpowers/specs/2026-11-18-ask-in-today-design.md`

## Global Constraints

- 界面中文。一天的边界是 `Asia/Shanghai`。
- 打开「今天」时模式是「记」。这个选择不写入本地存储。
- 「问」只发送去掉首尾空白后的文字，不带照片和视频。
- 回答的系统提示是「用中文直接回答。短一些。不要编造对方没问的生活事件。不要写成日记。」
- 记进日记的正文正好是 `问：` 加问题、换行、`答：` 加回答。
- 整理完成之后，记进日记和删除都返回 409，错误文案沿用「已经整理，不能再改」或「已经整理，不能再删」。
- 未登录返回 401，`{ error: "未登录" }`。
- 模型失败或空回答不写入 `asks`，页面显示「没问成，再试一次。」
- 不提交 git，除非用户明确要求。

## Review Focus

- 模式停在「记」时，正文含「吗」的句子只成为记录，不产生回答。测试：`tests/asks.test.ts` 的 `a life note is not an ask`。
- 同一条提问点两次「记进日记」只产生一个 `fragmentId`。测试：`tests/asks.test.ts` 的 `keeping twice reuses the fragment`。
- 已经挂上记录的提问不会在对话里再出现一条右边气泡。测试：`tests/asks.test.ts` 的 `a kept ask is not shown twice`。
- 空白问题不调用模型。测试：`tests/asks.test.ts` 的 `blank question is empty`。
- 模型没返回正文时不保存提问。测试：`tests/asks.test.ts` 的 `a blank answer is unusable`。

---

### Task 1: 问答规则

**Files:**
- Create: `src/lib/asks.ts`
- Modify: `src/domain/types.ts`
- Test: `tests/asks.test.ts`

**Interfaces:**
- Consumes: `Fragment` from `src/domain/types.ts`
- Produces:
  - `Ask = { id: string; day: string; createdAt: string; question: string; answer: string; fragmentId: string | null }`
  - `askDiaryBody(ask: Pick<Ask, "question" | "answer">): string`
  - `askMessages(question: string): { role: "system" | "user"; content: string }[]`
  - `answerIsUsable(answer: string): boolean`
  - `keepAsk(ask: Ask, fragmentId: string): Ask`
  - `threadItems(fragments: Fragment[], asks: Ask[]): ({ kind: "note"; fragment: Fragment } | { kind: "ask"; ask: Ask })[]`

- [ ] **Step 1: Write the failing test**

五个测试名用 Review Focus 里的原句。`a life note is not an ask`：`isBlankQuestion("今天午饭好吃吗")` 为 false，调用方因此不会走提问。`keeping twice reuses the fragment`：`keepAsk` 在 `fragmentId` 已是 `"f1"` 时返回同一对象。`a kept ask is not shown twice`：记录 id 等于提问的 `fragmentId` 时，`threadItems` 只有那条提问。`blank question is empty`：`isBlankQuestion("  ")` 为 true。`a blank answer is unusable`：`answerIsUsable("  ")` 为 false，`answerIsUsable("少放盐")` 为 true。另断言 `askDiaryBody({ question: "面汤怎么少放盐", answer: "少放盐，下午多喝水" })` 等于 `问：面汤怎么少放盐\n答：少放盐，下午多喝水`，且 `askMessages("面汤")[0].content` 含「不要写成日记」。

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/asks.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: Implement the signatures in `src/lib/asks.ts`**

`isBlankQuestion` 看 `trim()`。`answerIsUsable` 同样看 `trim()`。`keepAsk` 在 `ask.fragmentId` 已有值时返回原来的对象。`threadItems` 用 `createdAt` 升序，并去掉 id 落在任一 `fragmentId` 上的记录。

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/asks.test.ts`
Expected: PASS

### Task 2: 问答表

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/repository.ts`
- Modify: `src/db/mappers.ts`
- Test: `tests/mappers.test.ts`

**Interfaces:**
- Consumes: `Ask` from Task 1
- Produces:
  - 表 `asks`：`id`、`day`、`created_at`、`question`、`answer`、`fragment_id` 可空
  - `asksForDay(day: string): Promise<Ask[]>`
  - `insertAsk(input: { id: string; day: string; createdAt: Date; question: string; answer: string }): Promise<void>`
  - `attachAskFragment(id: string, fragmentId: string): Promise<void>`
  - `deleteAsk(id: string): Promise<void>`
  - `askById(id: string): Promise<Ask | null>`

- [ ] **Step 1: Write the failing mapper test**

`toAsk` 把 `{ fragmentId: null }` 和 `{ fragment_id: null }` 都收成 `fragmentId: null`。有值时保留字符串。

- [ ] **Step 2: Run `npx vitest run tests/mappers.test.ts`**

Expected: FAIL，`toAsk` 未定义。

- [ ] **Step 3: Add the table, mapper, and repository functions**

`asksForDay` 按 `createdAt` 升序。不在这一步调用模型。

- [ ] **Step 4: Run the mapper test again**

Expected: PASS

- [ ] **Step 5: Push the table**

Run: `npx drizzle-kit push`
Expected: `asks` 已应用到当前 `DATABASE_URL`。不要改动已有记录。

### Task 3: 提问接口

**Files:**
- Create: `src/app/api/asks/route.ts`
- Create: `src/app/api/asks/[id]/route.ts`
- Modify: `src/lib/lessonWriter.ts` 不改。回答走与 `src/lib/lessonWriter.ts` 相同的 `chatMessagesBody("deepseek-chat", askMessages(question))` 和 `https://api.deepseek.com/chat/completions`。

**Interfaces:**
- Consumes: Task 1 与 Task 2 的函数，`hasSession`，`insertFragment`，`polishedAtFor`，`canMutate`，`shanghaiDate`
- Produces:
  - `POST /api/asks`，正文 `{ question: string }`。空白返回 400 `{ error: "写一句再问" }`。成功返回 `{ ask: Ask }`。
  - `POST /api/asks/[id]` 表示记进日记。已有 `fragmentId` 时返回原来的 `ask`，不再插入记录。
  - `DELETE /api/asks/[id]` 删除提问；若有 `fragmentId`，同时删除那条记录。

- [ ] **Step 1: Implement the two routes**

登录失败 401。当天 `polishedAt` 已有值时，记进日记和删除返回 409。模型响应不是 2xx，或 `answerIsUsable` 为 false，返回 502 `{ error: "没问成，再试一次。" }` 且不插入。记进日记的记录正文用 `askDiaryBody`。

- [ ] **Step 2: Run `npx tsc --noEmit`**

Expected: PASS

### Task 4: 对话里的记和问

**Files:**
- Modify: `src/components/Composer.tsx`
- Modify: `src/app/(shell)/today/page.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/shell.test.tsx`

**Interfaces:**
- Consumes: `Ask`，`threadItems`，`POST /api/asks`，`POST /api/asks/[id]`，`DELETE /api/asks/[id]`
- Produces: 今天的对话同时渲染记录和提问

- [ ] **Step 1: Extend the shell test**

现有断言保持：按钮「改」「删」「语音」「表情」，以及带 `multiple` 的「照片」。再断言有按钮「记」和「问」。「记」的 `aria-pressed` 为 true。

- [ ] **Step 2: Run `npx vitest run tests/shell.test.tsx`**

Expected: FAIL，找不到「记」。

- [ ] **Step 3: Add the toggle and the left bubble**

`Composer` 增加 `asks: Ask[]`，默认 `[]`。模式状态 `"note" | "ask"`，初始 `"note"`。输入栏最左边是两个按钮「记」「问」。模式为「问」时占位符是「问一句…」，隐藏加号；发送只 `POST /api/asks`。回答用左边气泡，按钮「记进日记」；`fragmentId` 有值时改为文字「已记」。等待时左边显示「在想…」。失败时用现有错误条显示接口返回的 `error`。删除提问走 `DELETE /api/asks/[id]`。`today/page.tsx` 用 `asksForDay` 传入。

左边气泡类名 `bubble in`：靠左，背景 `var(--mui-palette-background-paper)`，文字 `var(--mui-palette-text-primary)`，圆角 `16px 16px 16px 4px`。

- [ ] **Step 4: Run `npx vitest run tests/shell.test.tsx tests/asks.test.ts tests/mappers.test.ts && npx tsc --noEmit`**

Expected: PASS

- [ ] **Step 5: 在浏览器里核对**

打开 `/today`。停在「记」时发出的字在右边。拨到「问」后发出的问题在右边、回答在左边，出现「记进日记」。点下去后变成「已记」，对话里没有第二条重复气泡。刷新后这条问答还在。
