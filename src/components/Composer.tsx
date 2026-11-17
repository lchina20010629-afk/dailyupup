"use client";

import { useState } from "react";
import type { Fragment, MediaKind } from "@/domain/types";
import { appendFragment, targetImageSize, VIDEO_MAX_BYTES } from "@/lib/fragments";
import { shanghaiClock } from "@/lib/time";

export function Composer({ initial }: { initial: Fragment[] }) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function edit(item: Fragment) {
    const next = window.prompt("改这条", item.body);
    if (next === null || next === item.body) return;
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, body: next } : entry)));
    if (item.id.startsWith("local-")) return;
    const response = await fetch(`/api/fragments/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: next }),
    });
    if (!response.ok) {
      setItems((current) => current.map((entry) => (entry.id === item.id ? item : entry)));
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "没有改成");
    }
  }

  async function remove(id: string) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    if (id.startsWith("local-")) return;
    const response = await fetch(`/api/fragments/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setItems(previous);
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "没有删掉");
    }
  }

  async function save(file?: File) {
    setError("");
    let upload: { kind: MediaKind; contentType: string; byteSize: number; blob: Blob } | null = null;
    if (file) {
      if (file.type.startsWith("video/")) {
        if (file.size > VIDEO_MAX_BYTES) {
          setError("这条视频超过 200MB，没有上传。");
          return;
        }
        upload = { kind: "video", contentType: file.type, byteSize: file.size, blob: file };
      } else {
        const blob = await compressImage(file);
        upload = { kind: "photo", contentType: "image/jpeg", byteSize: blob.size, blob };
      }
    }
    const body = text.trim();
    if (!body && !upload) return;
    const optimistic: Fragment = {
      id: `local-${Date.now()}`,
      day: "",
      createdAt: new Date().toISOString(),
      body,
      media: upload ? [{ id: "local-media", kind: upload.kind, byteSize: upload.byteSize }] : [],
    };
    setItems((current) => appendFragment(current, optimistic));
    setText("");
    setPending(true);
    const response = await fetch("/api/fragments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        media: upload ? [{ kind: upload.kind, contentType: upload.contentType, byteSize: upload.byteSize }] : [],
      }),
    });
    const payload = (await response.json()) as {
      fragment?: Fragment;
      uploads?: { url: string }[];
      error?: string;
    };
    if (!response.ok || !payload.fragment) {
      setItems((current) => current.filter((item) => item.id !== optimistic.id));
      setError(payload.error ?? "没有记下");
      setPending(false);
      return;
    }
    const target = payload.uploads?.[0];
    if (target && upload) {
      await fetch(target.url, { method: "PUT", headers: { "Content-Type": upload.contentType }, body: upload.blob });
    }
    setItems((current) => current.map((item) => (item.id === optimistic.id ? payload.fragment! : item)));
    setPending(false);
  }

  return (
    <>
      <ol className="notes">
        {items.map((item) => (
          <li key={item.id}>
            <time>{item.createdAt ? shanghaiClock(new Date(item.createdAt)) : ""}</time>
            {item.body ? <p>{item.body}</p> : null}
            {item.media.map((file) => (
              <span key={file.id}>{file.kind === "photo" ? "照片" : "视频"}</span>
            ))}
            <button type="button" onClick={() => edit(item)}>
              改
            </button>
            <button type="button" onClick={() => remove(item.id)}>
              删
            </button>
          </li>
        ))}
      </ol>
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="记一笔…" aria-label="记一笔" />
        <label>
          照片
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void save(file);
              event.target.value = "";
            }}
          />
        </label>
        <label>
          视频
          <input
            type="file"
            accept="video/*"
            capture="environment"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void save(file);
              event.target.value = "";
            }}
          />
        </label>
        <button type="submit" disabled={pending}>
          记下
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </>
  );
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = targetImageSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  return blob ?? file;
}
