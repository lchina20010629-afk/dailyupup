import { LessonCard } from "@/components/LessonCard";
import { SubjectNav } from "@/components/SubjectNav";
import type { StudyItem, Subject } from "@/lib/study";

export function StudyDesk({ items, current }: { items: StudyItem[]; current: Subject }) {
  const item = items.find((entry) => entry.subject === current);
  const left = items.reduce((sum, entry) => sum + (entry.done ? 0 : entry.minutes), 0);
  return (
    <div className="study">
      <div className="study-top">
        <p>{left > 0 ? `还剩 ${left} 分钟` : "今天学完了"}</p>
        <SubjectNav current={current} done={items.filter((entry) => entry.done).map((entry) => entry.subject)} />
      </div>
      {item ? <LessonCard item={item} /> : <p className="empty">今天这门还没有内容。</p>}
    </div>
  );
}
