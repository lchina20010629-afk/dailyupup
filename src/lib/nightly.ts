import type { Fragment } from "../domain/types";
import { buildPolishMessages } from "./polish";
import {
  buildLessonMessages,
  fallbackLesson,
  lessonIsUsable,
  needsModel,
  type Cursors,
  type LessonDraft,
  type StudyItem,
  tomorrowsPlan,
} from "./study";
import { addShanghaiDays, shanghaiDate } from "./time";

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

function groupByDay(
  loaded: { day: string; fragments?: Fragment[]; createdAt?: string; body?: string; media?: Fragment["media"]; id?: string }[],
): { day: string; fragments: Fragment[] }[] {
  if (loaded.every((item) => Array.isArray(item.fragments))) {
    return loaded.map((item) => ({ day: item.day, fragments: item.fragments ?? [] }));
  }
  const groups = new Map<string, Fragment[]>();
  for (const item of loaded) {
    const fragment = item as Fragment;
    const list = groups.get(fragment.day) ?? [];
    list.push(fragment);
    groups.set(fragment.day, list);
  }
  return [...groups.entries()].map(([day, fragments]) => ({ day, fragments }));
}

async function ask(chat: NightlyDeps["chat"], messages: { role: "system" | "user"; content: string }[]): Promise<string> {
  try {
    return await chat(messages);
  } catch {
    return "";
  }
}

export async function runNightly(deps: NightlyDeps): Promise<{ polishedDays: string[]; studyDay: string }> {
  const today = shanghaiDate(deps.now);
  const studyDay = addShanghaiDays(today, 1);
  const oldestDay = addShanghaiDays(today, -6);
  const loaded = await deps.loadUnpolished(oldestDay, today);
  const days = groupByDay(loaded).sort((left, right) => left.day.localeCompare(right.day)).slice(0, 2);
  const polishedAt = deps.now.toISOString();
  const polishedDays: string[] = [];
  for (const day of days) {
    const body = await ask(deps.chat, buildPolishMessages(day.day, day.fragments));
    await deps.savePolish(day.day, body, polishedAt);
    polishedDays.push(day.day);
  }
  const original = await deps.loadCursors();
  const planned = tomorrowsPlan({
    nextDay: studyDay,
    todayItems: await deps.loadStudy(today),
    cursors: { ...original },
  });
  const items: LessonDraft[] = [];
  for (const draft of planned.items) {
    const next = { ...draft };
    if (needsModel(next)) {
      const text = await ask(deps.chat, buildLessonMessages(next, planned.cursors));
      if (lessonIsUsable(next.subject, text)) {
        next.body = text;
      } else {
        next.body = fallbackLesson(next.subject);
        if (next.subject === "english" || next.subject === "thai") {
          planned.cursors[next.subject] = original[next.subject];
          next.unit = original[next.subject] + 1;
        }
      }
    }
    items.push(next);
  }
  await deps.saveLessons(studyDay, items);
  await deps.saveCursors(planned.cursors);
  return { polishedDays, studyDay };
}
