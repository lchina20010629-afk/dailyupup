import Link from "next/link";
import { listDays } from "@/db/repository";
import { missingEnv } from "@/lib/env";

export default async function DiaryIndexPage() {
  const missing = missingEnv(process.env);
  if (missing.length > 0) return <p>还缺这些配置：{missing.join("、")}</p>;
  const days = await listDays();
  return (
    <>
      <h1>日记</h1>
      {days.length === 0 ? <p>还没有记下的一天。</p> : null}
      <ul className="days">
        {days.map((day) => (
          <li key={day}>
            <Link href={`/diary/${day}`}>{day}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
