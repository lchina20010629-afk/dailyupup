import Link from "next/link";
import { missingEnv } from "@/lib/env";
import { todayStudy } from "@/lib/todayStudy";
import type { Subject } from "@/lib/study";

const ORDER: { subject: Subject; label: string }[] = [
  { subject: "business", label: "商业" },
  { subject: "english", label: "英语" },
  { subject: "thai", label: "泰语" },
  { subject: "cultivation", label: "修身" },
];

export default async function StudyIndex() {
  const missing = missingEnv(process.env);
  if (missing.length > 0) return <p>还缺这些配置：{missing.join("、")}</p>;
  const items = await todayStudy();
  const done = items.filter((item) => item.done).length;
  const left = items.reduce((sum, item) => sum + (item.done ? 0 : item.minutes), 0);
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{done} / 4 做完</p>
        <h1>{left > 0 ? `还剩 ${left} 分钟` : "今天学完了"}</h1>
      </header>
      <ol className="plan">
        {ORDER.map((entry) => {
          const item = items.find((row) => row.subject === entry.subject);
          return (
            <li key={entry.subject}>
              <Link href={`/study/${entry.subject}`}>
                <span className="plan-name">
                  {entry.label}
                  <small>{item ? opening(item.body) : "还没有"}</small>
                </span>
                <span className={item?.done ? "plan-side done" : "plan-side"}>{item?.done ? "做完" : item ? `${item.minutes} 分钟` : ""}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function opening(body: string): string {
  const line =
    body
      .split("\n")
      .map((part) => part.replace(/\*\*/g, "").trim())
      .find((part) => part.length > 0 && !/^单元\s*\d+/.test(part)) ?? "";
  return line.length > 28 ? `${line.slice(0, 28)}…` : line;
}
