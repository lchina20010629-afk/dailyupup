"use client";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useState } from "react";
import type { StudyItem, Subject } from "@/lib/study";
import { lessonLines } from "@/lib/speech";

const TITLE: Record<Subject, string> = {
  business: "商业",
  english: "英语",
  thai: "泰语",
  cultivation: "修身",
};
const CHECK: Record<Subject, string> = {
  business: "读完",
  english: "说完",
  thai: "跟读",
  cultivation: "记住",
};

export function LessonCard({ item }: { item: StudyItem }) {
  const [done, setDone] = useState(item.done);
  const lines = item.subject === "english" || item.subject === "thai" ? lessonLines(item.subject, item.body) : [];
  const spoken = lines.flatMap((line) => (line.spoken ? [line.spoken] : []));
  const lang = item.subject === "thai" ? "th-TH" : "en-US";

  async function toggle() {
    const next = !done;
    setDone(next);
    if (next) await fetch(`/api/study/${item.id}`, { method: "POST" });
  }

  return (
    <article className="lesson">
      <div className="lesson-body">
        <p className="lesson-kicker">
          {TITLE[item.subject]} · {item.minutes} 分钟
        </p>
        {item.title ? <h2>{item.title}</h2> : null}
        {lines.length > 0 ? (
          lines.map((line, index) =>
            line.spoken ? (
              <div key={`${index}-${line.text}`} className="spoken">
                <p>{line.text}</p>
                <button type="button" onClick={() => speak(line.spoken!, lang)}>
                  读这句
                </button>
              </div>
            ) : (
              <p key={`${index}-${line.text}`} className="lesson-note">
                {line.text}
              </p>
            ),
          )
        ) : (
          <p className="lesson-note">{item.body}</p>
        )}
      </div>
      <footer className="lesson-bar">
        {spoken.length > 0 ? (
          <button type="button" className="lesson-speak" onClick={() => speakAll(spoken, lang)}>
            全文朗读
          </button>
        ) : (
          <span />
        )}
        <FormControlLabel control={<Checkbox size="small" checked={done} onChange={() => void toggle()} />} label={CHECK[item.subject]} />
      </footer>
    </article>
  );
}

function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance(text, lang));
}

function speakAll(lines: string[], lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  for (const line of lines) window.speechSynthesis.speak(utterance(line, lang));
}

function utterance(text: string, lang: string): SpeechSynthesisUtterance {
  const result = new SpeechSynthesisUtterance(text);
  result.lang = lang;
  result.rate = lang === "th-TH" ? 0.82 : 0.96;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (voice) result.voice = voice;
  return result;
}
