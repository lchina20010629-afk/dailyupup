export type Subject = "business" | "english" | "thai" | "cultivation";

export type StudyItem = {
  id: string;
  day: string;
  subject: Subject;
  minutes: number;
  title: string;
  body: string;
  done: boolean;
  unit: number | null;
};

export type Cursors = { english: number; thai: number };

export type LessonDraft = {
  subject: Subject;
  minutes: number;
  title: string;
  body: string;
  unit: number | null;
  carryId: string | null;
};

export const SUBJECT_MINUTES: Record<Subject, number> = {
  business: 8,
  english: 8,
  thai: 8,
  cultivation: 6,
};

const ORDER: Subject[] = ["business", "english", "thai", "cultivation"];

export function initialCursors(): Cursors {
  return { english: 0, thai: 0 };
}

function blank(subject: Subject, unit: number | null): LessonDraft {
  return { subject, minutes: SUBJECT_MINUTES[subject], title: "", body: "", unit, carryId: null };
}

export function ensureToday(input: { today: string; existing: StudyItem[]; cursors: Cursors }): LessonDraft[] | null {
  if (input.existing.length > 0) return null;
  return ORDER.map((subject) => {
    if (subject === "english") return blank(subject, input.cursors.english + 1);
    if (subject === "thai") return blank(subject, input.cursors.thai + 1);
    return blank(subject, null);
  });
}

export function tomorrowsPlan(input: {
  nextDay: string;
  todayItems: StudyItem[];
  cursors: Cursors;
}): { items: LessonDraft[]; cursors: Cursors } {
  const cursors = { ...input.cursors };
  const items = ORDER.map((subject) => {
    const today = input.todayItems.find((item) => item.subject === subject);
    if (!today) {
      if (subject === "english") return blank(subject, cursors.english + 1);
      if (subject === "thai") return blank(subject, cursors.thai + 1);
      return blank(subject, null);
    }
    if (!today.done) {
      return {
        subject,
        minutes: SUBJECT_MINUTES[subject],
        title: today.title,
        body: today.body,
        unit: today.unit,
        carryId: today.id,
      };
    }
    if (subject === "english" || subject === "thai") {
      const unit = (today.unit ?? cursors[subject]) + 1;
      cursors[subject] = today.unit ?? cursors[subject];
      return blank(subject, unit);
    }
    return blank(subject, null);
  });
  return { items, cursors };
}

export function needsModel(draft: LessonDraft): boolean {
  return draft.carryId === null;
}

function markerCount(body: string, mark: string): number {
  return body.split(mark).length - 1;
}

export function lessonIsUsable(subject: Subject, body: string): boolean {
  if (subject === "english") return body.includes("场景：") && body.includes("对话：") && body.includes("今天说：") && body.includes("译：");
  if (subject === "thai") return ["泰文：", "读音：", "声调：", "中文："].every((mark) => markerCount(body, mark) >= 6);
  return body.trim().length >= 20;
}

export function fallbackLesson(_subject: Subject): string {
  return "今晚这门没写成，明天会再写。";
}

export function buildLessonMessages(
  draft: LessonDraft,
  _cursors: Cursors,
): { role: "system" | "user"; content: string }[] {
  const system = {
    business: "写一个商业概念，三到五行，当天能想一想。",
    english:
      "本人已有大学英语四级水平。以口语和日常使用为主，可以比四级课本更深：语气、衔接和职场里真会说的话。不要出考试阅读。正文必须包含场景：、对话：、今天说：。对话和今天说里的每个英文句子单独成行，下一行用译：写出这句的中文，短、口语。场景说明和词汇讲解不要写译：。",
    thai: "零基础。从字母和读音开始，单元连续，不跳、不重复。单元1到8教辅音，每单元6个，从 ก 按字母表接着上一单元。单元9到14教元音，每单元6个。单元15教五个声调，每个声调两个例词。单元16起教日常短句，每单元8句。每一项都写成四行：泰文：、读音：、声调：、中文：。辅音和元音的中文要有字母名和一个例词。一项都不要少。",
    cultivation: "写一个职场里用得上的做法。",
  }[draft.subject];
  return [
    { role: "system", content: system },
    { role: "user", content: `单元 ${draft.unit ?? "无"}，${draft.minutes} 分钟。` },
  ];
}
