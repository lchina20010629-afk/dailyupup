"use client";

import { useState } from "react";
import type { StudyItem, Subject } from "@/lib/study";

const ORDER: Subject[] = ["business", "english", "thai", "cultivation"];
const TITLE: Record<Subject, string> = {
  business: "商业",
  english: "英语",
  thai: "泰语",
  cultivation: "修养",
};
const CHECK: Record<Subject, string> = {
  business: "读完",
  english: "说完",
  thai: "跟读",
  cultivation: "记住",
};

export function StudyList({ items }: { items: StudyItem[] }) {
  const [done, setDone] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((item) => [item.id, item.done])),
  );
  const ordered = ORDER.map((subject) => items.find((item) => item.subject === subject)).filter(
    (item): item is StudyItem => Boolean(item),
  );

  async function toggle(item: StudyItem) {
    const next = !done[item.id];
    setDone((current) => ({ ...current, [item.id]: next }));
    if (next) await fetch(`/api/study/${item.id}`, { method: "POST" });
  }

  return (
    <section className="study">
      <p className="minutes">约 30 分钟</p>
      {ordered.map((item) => (
        <article key={item.id}>
          <h2>
            {TITLE[item.subject]} · {item.minutes} 分钟
          </h2>
          {item.title ? <h3>{item.title}</h3> : null}
          <p className="lesson">{item.body}</p>
          <label>
            <input type="checkbox" checked={Boolean(done[item.id])} onChange={() => toggle(item)} />
            {CHECK[item.subject]}
          </label>
        </article>
      ))}
    </section>
  );
}
