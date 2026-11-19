"use client";

import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
    <Paper component="article" variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
        {TITLE[item.subject]} · {item.minutes} 分钟
      </Typography>
      {item.title ? (
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {item.title}
        </Typography>
      ) : null}
      {lines.length > 0 ? (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {lines.map((line, index) =>
            line.spoken ? (
              <Stack key={`${index}-${line.text}`} direction="row" spacing={0.5} sx={{ alignItems: "flex-start" }}>
                <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.45 }}>
                  {line.text}
                </Typography>
                <Button type="button" size="small" variant="outlined" onClick={() => speak(line.spoken!, lang)} sx={{ flexShrink: 0 }}>
                  读这句
                </Button>
              </Stack>
            ) : (
              <Typography key={`${index}-${line.text}`} variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                {line.text}
              </Typography>
            ),
          )}
          {spoken.length > 0 ? (
            <Button type="button" size="small" variant="contained" onClick={() => speakAll(spoken, lang)} sx={{ alignSelf: "flex-start" }}>
              全文朗读
            </Button>
          ) : null}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
          {item.body}
        </Typography>
      )}
      <FormControlLabel
        sx={{ mt: 0.5, ml: 0 }}
        control={<Checkbox size="small" checked={done} onChange={() => void toggle()} />}
        label={CHECK[item.subject]}
      />
    </Paper>
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
