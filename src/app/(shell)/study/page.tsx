import { StudyDesk } from "@/components/StudyDesk";
import { missingEnv } from "@/lib/env";
import { todayStudy } from "@/lib/todayStudy";
import type { Subject } from "@/lib/study";

export default async function StudyIndex() {
  const missing = missingEnv(process.env);
  if (missing.length > 0) return <p>还缺这些配置：{missing.join("、")}</p>;
  const items = await todayStudy();
  const current: Subject = items.find((item) => !item.done)?.subject ?? "business";
  return <StudyDesk items={items} current={current} />;
}
