export type MediaKind = "photo" | "video";

export type Fragment = {
  id: string;
  day: string;
  createdAt: string;
  body: string;
  media: { id: string; kind: MediaKind; byteSize: number }[];
};

export type DiaryDay = {
  day: string;
  polishedBody: string | null;
  polishedAt: string | null;
  fragments: Fragment[];
};
