import { notFound } from "next/navigation";
import { LessonCard } from "@/components/LessonCard";
import { SubjectNav } from "@/components/SubjectNav";
import { missingEnv } from "@/lib/env";
import { todayStudy } from "@/lib/todayStudy";
import type { Subject } from "@/lib/study";

const SUBJECTS: Subject[] = ["business", "english", "thai", "cultivation"];

function isSubject(value: string): value is Subject {
  return SUBJECTS.includes(value as Subject);
}

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  if (!isSubject(subject)) notFound();
  const missing = missingEnv(process.env);
  if (missing.length > 0) return <p>还缺这些配置：{missing.join("、")}</p>;
  const items = await todayStudy();
  const item = items.find((entry) => entry.subject === subject);
  return (
    <div className="study">
      <SubjectNav current={subject} />
      {item ? <LessonCard item={item} /> : <p className="empty">今天这门还没有内容。</p>}
    </div>
  );
}
