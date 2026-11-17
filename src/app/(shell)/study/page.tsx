import { StudyList } from "@/components/StudyList";
import { loadCursors, loadStudy, saveLessons } from "@/db/repository";
import { missingEnv } from "@/lib/env";
import { writeLesson } from "@/lib/lessonWriter";
import { ensureToday } from "@/lib/study";
import { shanghaiDate } from "@/lib/time";

export default async function StudyPage() {
  const missing = missingEnv(process.env);
  if (missing.length > 0) return <p>还缺这些配置：{missing.join("、")}</p>;
  const today = shanghaiDate(new Date());
  let items = await loadStudy(today);
  if (items.length === 0) {
    const cursors = await loadCursors();
    const drafts = ensureToday({ today, existing: items, cursors });
    if (drafts) {
      const filled = [];
      for (const draft of drafts) filled.push({ ...draft, body: await writeLesson(draft, cursors) });
      await saveLessons(today, filled);
      items = await loadStudy(today);
    }
  }
  return (
    <>
      <h1>学习</h1>
      <StudyList items={items} />
    </>
  );
}
