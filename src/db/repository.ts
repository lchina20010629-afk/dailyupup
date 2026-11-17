import { neon } from "@neondatabase/serverless";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import type { MediaKind } from "../domain/types";
import type { Cursors, LessonDraft, StudyItem, Subject } from "../lib/study";
import { toCursors, toFragment, toStudyItem } from "./mappers";
import { diaryDays, fragments, media, studyCursors, studyItems } from "./schema";

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("缺少 DATABASE_URL");
  return drizzle(neon(url));
}

function asKind(kind: string): MediaKind {
  return kind === "video" ? "video" : "photo";
}

export async function insertFragment(input: {
  id: string;
  day: string;
  createdAt: Date;
  body: string;
  media: { id: string; kind: MediaKind; contentType: string; byteSize: number; r2Key: string }[];
}) {
  const db = database();
  await db.insert(fragments).values({
    id: input.id,
    day: input.day,
    createdAt: input.createdAt,
    body: input.body,
  });
  if (input.media.length > 0) {
    await db.insert(media).values(
      input.media.map((item) => ({
        id: item.id,
        fragmentId: input.id,
        kind: item.kind,
        r2Key: item.r2Key,
        contentType: item.contentType,
        byteSize: item.byteSize,
      })),
    );
  }
}

export async function fragmentsForDay(day: string) {
  const db = database();
  const rows = await db.select().from(fragments).where(eq(fragments.day, day)).orderBy(asc(fragments.createdAt));
  const files = rows.length === 0 ? [] : await db.select().from(media);
  return rows.map((row) =>
    toFragment(
      row,
      files
        .filter((file) => file.fragmentId === row.id)
        .map((file) => ({ id: file.id, kind: asKind(file.kind), byteSize: file.byteSize })),
    ),
  );
}

export async function polishedAtFor(day: string): Promise<string | null> {
  const db = database();
  const [row] = await db.select().from(diaryDays).where(eq(diaryDays.day, day));
  return row?.polishedAt ? row.polishedAt.toISOString() : null;
}

export async function updateFragmentBody(id: string, body: string) {
  const db = database();
  await db.update(fragments).set({ body }).where(eq(fragments.id, id));
}

export async function deleteFragment(id: string) {
  const db = database();
  await db.delete(media).where(eq(media.fragmentId, id));
  await db.delete(fragments).where(eq(fragments.id, id));
}

export async function fragmentDay(id: string): Promise<string | null> {
  const db = database();
  const [row] = await db.select().from(fragments).where(eq(fragments.id, id));
  return row?.day ?? null;
}

export async function loadUnpolished(oldestDay: string, today: string) {
  const db = database();
  const rows = await db
    .select()
    .from(fragments)
    .where(and(gte(fragments.day, oldestDay), lte(fragments.day, today)))
    .orderBy(asc(fragments.day), asc(fragments.createdAt));
  const polished = await db
    .select()
    .from(diaryDays)
    .where(and(gte(diaryDays.day, oldestDay), lte(diaryDays.day, today)));
  const done = new Set(polished.filter((day) => day.polishedBody).map((day) => day.day));
  const files = rows.length === 0 ? [] : await db.select().from(media);
  const grouped = new Map<string, ReturnType<typeof toFragment>[]>();
  for (const row of rows) {
    if (done.has(row.day)) continue;
    const list = grouped.get(row.day) ?? [];
    list.push(
      toFragment(
        row,
        files
          .filter((file) => file.fragmentId === row.id)
          .map((file) => ({ id: file.id, kind: asKind(file.kind), byteSize: file.byteSize })),
      ),
    );
    grouped.set(row.day, list);
  }
  return [...grouped.entries()].map(([day, dayFragments]) => ({ day, fragments: dayFragments }));
}

export async function savePolish(day: string, body: string, polishedAt: string) {
  const db = database();
  await db
    .insert(diaryDays)
    .values({ day, polishedBody: body, polishedAt: new Date(polishedAt) })
    .onConflictDoUpdate({
      target: diaryDays.day,
      set: { polishedBody: body, polishedAt: new Date(polishedAt) },
    });
}

export async function loadStudy(day: string): Promise<StudyItem[]> {
  const db = database();
  const rows = await db.select().from(studyItems).where(eq(studyItems.day, day));
  return rows.map((row) =>
    toStudyItem({
      ...row,
      subject: row.subject as Subject,
    }),
  );
}

export async function loadCursors(): Promise<Cursors> {
  const db = database();
  const rows = await db.select().from(studyCursors);
  return toCursors(rows);
}

export async function saveCursors(cursors: Cursors) {
  const db = database();
  for (const subject of ["english", "thai"] as const) {
    await db
      .insert(studyCursors)
      .values({ subject, unit: cursors[subject] })
      .onConflictDoUpdate({ target: studyCursors.subject, set: { unit: cursors[subject] } });
  }
}

export async function saveLessons(day: string, items: LessonDraft[]) {
  const db = database();
  await db.delete(studyItems).where(eq(studyItems.day, day));
  if (items.length === 0) return;
  await db.insert(studyItems).values(
    items.map((item) => ({
      id: crypto.randomUUID(),
      day,
      subject: item.subject,
      minutes: item.minutes,
      title: item.title,
      body: item.body,
      done: false,
      unit: item.unit,
    })),
  );
}

export async function listDiaryDays() {
  const db = database();
  return db.select().from(diaryDays).orderBy(asc(diaryDays.day));
}

export async function diaryFor(day: string) {
  const db = database();
  const [row] = await db.select().from(diaryDays).where(eq(diaryDays.day, day));
  return row ?? null;
}

export async function markStudyDone(id: string) {
  const db = database();
  await db.update(studyItems).set({ done: true }).where(eq(studyItems.id, id));
}

export async function listDays(): Promise<string[]> {
  const db = database();
  const noted = await db.select({ day: fragments.day }).from(fragments);
  const polished = await db.select({ day: diaryDays.day }).from(diaryDays);
  return [...new Set([...noted.map((row) => row.day), ...polished.map((row) => row.day)])].sort().reverse();
}

export async function mediaKey(id: string): Promise<string | null> {
  const db = database();
  const [row] = await db.select().from(media).where(eq(media.id, id));
  return row?.r2Key ?? null;
}
