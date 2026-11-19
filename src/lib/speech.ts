import type { Subject } from "./study";

export type LessonLine = { text: string; spoken: string | null; gloss: string | null };

export function lessonLines(subject: Extract<Subject, "english" | "thai">, body: string): LessonLine[] {
  const lines: LessonLine[] = [];
  for (const raw of body.split(/\n+/)) {
    const line = raw.trim();
    if (!line || /^单元\s*\d+.*分钟/.test(line)) continue;
    if (subject === "english" && /^译[:：]/.test(line)) {
      const gloss = line.replace(/^译[:：]\s*/, "").trim();
      const last = lines.at(-1);
      if (last?.spoken && gloss) last.gloss = gloss;
      continue;
    }
    if (subject === "thai") {
      const value = stripLabel(line);
      lines.push(/[\u0E00-\u0E7F]/.test(value) ? { text: line, spoken: value, gloss: null } : { text: line, spoken: null, gloss: null });
      continue;
    }
    if (mostlyChinese(line) || !/[A-Za-z]/.test(line)) {
      lines.push({ text: line, spoken: null, gloss: null });
      continue;
    }
    const speaker = line.match(/^([A-Za-z][A-Za-z .'-]{0,20}):\s*/);
    const value = speaker ? line.slice(speaker[0].length) : stripLabel(line);
    const sentences = value
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => /[A-Za-z]/.test(sentence) && !mostlyChinese(sentence));
    if (sentences.length === 0) {
      lines.push({ text: line, spoken: null, gloss: null });
      continue;
    }
    sentences.forEach((sentence, index) => {
      const text = speaker && index === 0 ? `${speaker[1]}: ${sentence}` : sentence;
      lines.push({ text, spoken: sentence, gloss: null });
    });
  }
  return lines;
}

export function speakableLines(subject: Extract<Subject, "english" | "thai">, body: string): string[] {
  return lessonLines(subject, body).flatMap((line) => (line.spoken ? [line.spoken] : []));
}

function stripLabel(line: string): string {
  return line.replace(/^[^:：]{0,12}[：:]/, "").trim();
}

function mostlyChinese(text: string): boolean {
  const chinese = text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  return chinese > latin;
}
