import type { Ask, DiaryDay, Fragment, MediaKind } from "../domain/types";
import type { Cursors, StudyItem, Subject } from "../lib/study";

export function toFragment(
  row: { id: string; day: string; createdAt: Date; body: string },
  mediaRows: { id: string; kind: MediaKind; byteSize: number }[],
): Fragment {
  return {
    id: row.id,
    day: row.day,
    createdAt: row.createdAt.toISOString(),
    body: row.body,
    media: mediaRows.map((item) => ({ id: item.id, kind: item.kind, byteSize: item.byteSize })),
  };
}

export function toDiary(
  day: string,
  polished: { polishedBody: string | null; polishedAt: Date | null } | null,
  fragments: Fragment[],
): DiaryDay {
  return {
    day,
    polishedBody: polished?.polishedBody ?? null,
    polishedAt: polished?.polishedAt ? polished.polishedAt.toISOString() : null,
    fragments,
  };
}

export function toStudyItem(row: {
  id: string;
  day: string;
  subject: Subject;
  minutes: number;
  title: string;
  body: string;
  done: boolean;
  unit: number | null;
}): StudyItem {
  return { ...row };
}

export function toAsk(row: {
  id: string;
  day: string;
  createdAt: Date;
  question: string;
  answer: string;
  fragmentId?: string | null;
  fragment_id?: string | null;
}): Ask {
  const fragmentId = Object.prototype.hasOwnProperty.call(row, "fragmentId") ? row.fragmentId : row.fragment_id;
  return {
    id: row.id,
    day: row.day,
    createdAt: row.createdAt.toISOString(),
    question: row.question,
    answer: row.answer,
    fragmentId: fragmentId ?? null,
  };
}

export function toCursors(rows: { subject: string; unit: number }[]): Cursors {
  const cursors: Cursors = { english: 0, thai: 0 };
  for (const row of rows) {
    if (row.subject === "english" || row.subject === "thai") cursors[row.subject] = row.unit;
  }
  return cursors;
}
