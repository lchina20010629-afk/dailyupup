import Link from "next/link";
import { listDays } from "@/db/repository";
import { missingEnv } from "@/lib/env";
import { shanghaiDayLabel } from "@/lib/time";

export default async function DiaryIndexPage() {
  const missing = missingEnv(process.env);
  if (missing.length > 0) return <p>还缺这些配置：{missing.join("、")}</p>;
  const days = await listDays();
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">整理过的日子</p>
        <h1>日记</h1>
      </header>
      {days.length === 0 ? <p>还没有记下的一天。今天写的，夜里 11 点这一小时会收进来。</p> : null}
      <ul className="days">
        {days.map((day) => (
          <li key={day}>
            <Link href={`/diary/${day}`}>{shanghaiDayLabel(day)}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
