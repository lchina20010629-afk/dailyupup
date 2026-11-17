import type { Fragment, MediaKind } from "../domain/types";

export const VIDEO_MAX_BYTES = 209715200;

export function assertCanSave(input: {
  body: string;
  media: { kind: MediaKind; byteSize: number }[];
}): "ok" | "empty" | "too-big" {
  if (input.media.some((item) => item.kind === "video" && item.byteSize > VIDEO_MAX_BYTES)) return "too-big";
  if (input.body.trim().length === 0 && input.media.length === 0) return "empty";
  return "ok";
}

export function canMutate(polishedAt: string | null): boolean {
  return polishedAt === null;
}

export function sortedFragments(items: Fragment[]): Fragment[] {
  return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function targetImageSize(width: number, height: number, maxEdge = 1600): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
