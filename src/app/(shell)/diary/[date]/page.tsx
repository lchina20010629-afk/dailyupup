import { ZoomPhoto } from "@/components/ZoomPhoto";
import { diaryFor, fragmentsForDay, mediaKey } from "@/db/repository";
import { PENDING_POLISH } from "@/lib/polish";
import { signRead } from "@/lib/r2";
import { shanghaiClock, shanghaiDayLabel } from "@/lib/time";

export default async function DiaryDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const [diary, fragments] = await Promise.all([diaryFor(date), fragmentsForDay(date)]);
  const urls = new Map<string, string>();
  for (const fragment of fragments) {
    for (const file of fragment.media) {
      const key = await mediaKey(file.id);
      if (key) urls.set(file.id, await signRead(key));
    }
  }
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">这一天</p>
        <h1>{shanghaiDayLabel(date)}</h1>
      </header>
      <section className="panel">
        <h2>整理</h2>
        {diary?.polishedBody ? <p className="prose">{diary.polishedBody}</p> : <p>{PENDING_POLISH}</p>}
      </section>
      <section className="panel originals">
        <h2>原文</h2>
        {fragments.map((fragment) => (
          <article key={fragment.id}>
            <time>{shanghaiClock(new Date(fragment.createdAt))}</time>
            {fragment.body ? <p>{fragment.body}</p> : null}
            {fragment.media.map((file) => {
              const url = urls.get(file.id);
              if (!url) return null;
              return file.kind === "photo" ? (
                <ZoomPhoto key={file.id} src={url} />
              ) : (
                <video key={file.id} src={url} controls />
              );
            })}
          </article>
        ))}
      </section>
    </>
  );
}
