import { Composer } from "@/components/Composer";
import { asksForDay, fragmentsForDay, mediaKey } from "@/db/repository";
import { missingEnv } from "@/lib/env";
import { signRead } from "@/lib/r2";
import { shanghaiDate } from "@/lib/time";

export default async function TodayPage() {
  const missing = missingEnv(process.env);
  if (missing.length > 0) return <p>还缺这些配置：{missing.join("、")}</p>;
  const now = new Date();
  const day = shanghaiDate(now);
  const heading = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
  const [items, asks] = await Promise.all([fragmentsForDay(day), asksForDay(day)]);
  const urls: Record<string, string> = {};
  for (const fragment of items) {
    for (const file of fragment.media) {
      const key = await mediaKey(file.id);
      if (key) urls[file.id] = await signRead(key);
    }
  }
  return (
    <section className="chat">
      <header className="chat-title">
        <strong>今天</strong>
        <span>{heading}</span>
      </header>
      <Composer initial={items} asks={asks} urls={urls} />
    </section>
  );
}
