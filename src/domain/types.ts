export type MediaKind = "photo" | "video";

export type Fragment = {
  id: string;
  day: string;
  createdAt: string;
  body: string;
  media: { id: string; kind: MediaKind; byteSize: number }[];
};

export type Ask = {
  id: string;
  day: string;
  createdAt: string;
  question: string;
  answer: string;
  fragmentId: string | null;
};

export type DiaryDay = {
  day: string;
  polishedBody: string | null;
  polishedAt: string | null;
  fragments: Fragment[];
};
