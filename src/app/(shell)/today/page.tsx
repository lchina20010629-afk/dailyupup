import { Composer } from "@/components/Composer";
import { fragmentsForDay } from "@/db/repository";
import { missingEnv } from "@/lib/env";
import { shanghaiDate } from "@/lib/time";

export default async function TodayPage() {
  const missing = missingEnv(process.env);
  if (missing.length > 0) return <p>还缺这些配置：{missing.join("、")}</p>;
  const day = shanghaiDate(new Date());
  const items = await fragmentsForDay(day);
  return (
    <>
      <h1>今天</h1>
      <Composer initial={items} />
    </>
  );
}
