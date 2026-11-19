import { loadCursors, loadStudy, saveLessons } from "@/db/repository";
import { writeLesson } from "@/lib/lessonWriter";
import { ensureToday, type StudyItem } from "@/lib/study";
import { shanghaiDate } from "@/lib/time";

export async function todayStudy(): Promise<StudyItem[]> {
  const today = shanghaiDate(new Date());
  let items = await loadStudy(today);
  if (items.length > 0) return items;
  const cursors = await loadCursors();
  const drafts = ensureToday({ today, existing: items, cursors });
  if (!drafts) return items;
  const filled = [];
  for (const draft of drafts) filled.push({ ...draft, body: await writeLesson(draft, cursors) });
  await saveLessons(today, filled);
  items = await loadStudy(today);
  return items;
}
