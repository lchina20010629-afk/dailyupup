"use client";

import AddIcon from "@mui/icons-material/Add";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MicNoneIcon from "@mui/icons-material/MicNone";
import MoodOutlinedIcon from "@mui/icons-material/MoodOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import Alert from "@mui/material/Alert";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import type { Ask, Fragment, MediaKind } from "@/domain/types";
import { threadItems } from "@/lib/asks";
import { ZoomPhoto } from "@/components/ZoomPhoto";
import { appendFragment, targetImageSize, VIDEO_MAX_BYTES } from "@/lib/fragments";
import { shanghaiClock } from "@/lib/time";

type PendingFile = {
  id: string;
  kind: MediaKind;
  contentType: string;
  blob: Blob;
  preview?: string;
};

const FACES = ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "🥰", "😗", "😙", "😚", "🙂", "🤗", "🤩", "🤔", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "😳", "🤪", "😵", "😡", "😠", "🤬", "😷", "🤒", "🤕", "🤢", "😇", "🥳", "🥺", "🤠", "🤡", "🤥", "🤫", "🤭", "🧐", "🤓", "😈", "💀", "👍", "👎", "👏", "🙏", "💪", "✌️", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "✨", "🌟", "☀️", "🌙", "⭐", "🔥", "💯", "☕️", "📚", "🎉"];
const KAOMOJI = ["(^_^)", "(￣▽￣)", "(>_<)", "(・ω・)", "(ノ´∀｀*)", "(*^▽^*)"];

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

export function Composer({
  initial,
  asks: initialAsks = [],
  urls = {},
}: {
  initial: Fragment[];
  asks?: Ask[];
  urls?: Record<string, string>;
}) {
  const [items, setItems] = useState(initial);
  const [asks, setAsks] = useState(initialAsks);
  const [mode, setMode] = useState<"note" | "ask">("note");
  const [waiting, setWaiting] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [attached, setAttached] = useState<PendingFile[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [editing, setEditing] = useState<Fragment | null>(null);
  const [draft, setDraft] = useState("");
  const [recalling, setRecalling] = useState<{ kind: "note" | "ask"; id: string } | null>(null);
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const canSend = mode === "ask" ? text.trim().length > 0 : text.trim().length > 0 || attached.length > 0;
  const thread = threadItems(items, asks);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [thread.length, attached.length, waiting]);

  useEffect(() => {
    if (!emojiOpen && !moreOpen) return;
    function closeIfOutside(event: PointerEvent) {
      const node = event.target instanceof Element ? event.target : null;
      if (node?.closest(".picker.open, .attach.open, [data-popup-toggle]")) return;
      setEmojiOpen(false);
      setMoreOpen(false);
    }
    document.addEventListener("pointerdown", closeIfOutside);
    return () => document.removeEventListener("pointerdown", closeIfOutside);
  }, [emojiOpen, moreOpen]);

  function insert(token: string) {
    const field = inputRef.current;
    const start = field?.selectionStart ?? text.length;
    const end = field?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${token}${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      field?.focus();
      const caret = start + token.length;
      field?.setSelectionRange(caret, caret);
    });
  }

  function listen() {
    const host = window as Window & { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
    const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
    if (!Ctor) {
      setError("这台设备不能直接听写，用键盘上的麦克风即可。");
      inputRef.current?.focus();
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const said = event.results[0]?.[0]?.transcript ?? "";
      if (said) insert(said);
    };
    recognition.onerror = () => setError("没有听清，用键盘上的麦克风即可。");
    recognition.onend = () => setListening(false);
    setListening(true);
    setError("");
    recognition.start();
  }

  async function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    const next: PendingFile[] = [];
    for (const file of Array.from(list)) {
      const blob = await compressImage(file);
      next.push({
        id: `local-${crypto.randomUUID()}`,
        kind: "photo",
        contentType: "image/jpeg",
        blob,
        preview: URL.createObjectURL(blob),
      });
    }
    setAttached((current) => [...current, ...next]);
    setError("");
  }

  function addVideo(file?: File) {
    if (!file) return;
    if (file.size > VIDEO_MAX_BYTES) {
      setError("这条视频超过 200MB，没有上传。");
      return;
    }
    setAttached((current) => [
      ...current,
      { id: `local-${crypto.randomUUID()}`, kind: "video", contentType: file.type || "video/mp4", blob: file },
    ]);
    setError("");
  }

  function openEdit(item: Fragment) {
    setEditing(item);
    setDraft(item.body);
  }

  async function commitEdit() {
    const item = editing;
    if (!item) return;
    const next = draft;
    if (!next.trim() && item.media.length === 0) return;
    setEditing(null);
    if (next === item.body) return;
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

  async function confirmRecall() {
    const target = recalling;
    if (!target) return;
    setRecalling(null);
    if (target.kind === "ask") {
      await removeAsk(target.id);
      return;
    }
    await remove(target.id);
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

  async function askQuestion() {
    const question = text.trim();
    if (!question) return;
    setText("");
    setWaiting(true);
    setError("");
    setEmojiOpen(false);
    setMoreOpen(false);
    const response = await fetch("/api/asks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const payload = (await response.json().catch(() => null)) as { ask?: Ask; error?: string } | null;
    setWaiting(false);
    if (!response.ok || !payload?.ask) {
      setText(question);
      setError(payload?.error ?? "没问成，再试一次。");
      return;
    }
    setAsks((current) => [...current, payload.ask!]);
  }

  async function keep(item: Ask) {
    const response = await fetch(`/api/asks/${item.id}`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { ask?: Ask; error?: string } | null;
    if (!response.ok || !payload?.ask) {
      setError(payload?.error ?? "没有记下");
      return;
    }
    setAsks((current) => current.map((entry) => (entry.id === item.id ? payload.ask! : entry)));
  }

  async function removeAsk(id: string) {
    const previous = asks;
    setAsks((current) => current.filter((item) => item.id !== id));
    const response = await fetch(`/api/asks/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setAsks(previous);
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "没有删掉");
    }
  }

  async function save() {
    if (mode === "ask") {
      await askQuestion();
      return;
    }
    const body = text.trim();
    const files = attached;
    if (!body && files.length === 0) return;
    const optimistic: Fragment = {
      id: `local-${Date.now()}`,
      day: "",
      createdAt: new Date().toISOString(),
      body,
      media: files.map((file) => ({ id: file.id, kind: file.kind, byteSize: file.blob.size })),
    };
    setLocalUrls((current) => ({
      ...current,
      ...Object.fromEntries(files.flatMap((file) => (file.preview ? [[file.id, file.preview]] : []))),
    }));
    setItems((current) => appendFragment(current, optimistic));
    setText("");
    setAttached([]);
    setEmojiOpen(false);
    setMoreOpen(false);
    setPending(true);
    setError("");
    const response = await fetch("/api/fragments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        media: files.map((file) => ({ kind: file.kind, contentType: file.contentType, byteSize: file.blob.size })),
      }),
    });
    const payload = (await response.json()) as {
      fragment?: Fragment;
      uploads?: { url: string }[];
      error?: string;
    };
    if (!response.ok || !payload.fragment) {
      setItems((current) => current.filter((item) => item.id !== optimistic.id));
      setAttached(files);
      setText(body);
      setError(payload.error ?? "没有记下");
      setPending(false);
      return;
    }
    const uploaded = await Promise.all(
      (payload.uploads ?? []).map((upload, index) => {
        const file = files[index];
        if (!file) return Promise.resolve(null);
        return fetch(upload.url, { method: "PUT", headers: { "Content-Type": file.contentType }, body: file.blob });
      }),
    );
    if (uploaded.some((result) => result && !result.ok)) setError("文件没有传上去。");
    setLocalUrls((current) => {
      const next = { ...current };
      payload.fragment?.media.forEach((file, index) => {
        const preview = files[index]?.preview;
        if (preview) next[file.id] = preview;
      });
      return next;
    });
    setItems((current) => current.map((item) => (item.id === optimistic.id ? payload.fragment! : item)));
    setPending(false);
  }

  return (
    <>
      <div className="thread" ref={threadRef} role="log" aria-label="今天的对话">
        <div className="thread-spacer" />
        {thread.length === 0 && !waiting ? (
          <Typography className="empty" variant="body2" color="text.secondary">
            记一条，或拨到「问」。夜里 11 点这一小时会收成日记。
          </Typography>
        ) : null}
        {thread.map((entry) =>
          entry.kind === "ask" ? (
            <div key={entry.ask.id}>
              <div className="msg">
                <time className="stamp">{shanghaiClock(new Date(entry.ask.createdAt))}</time>
                <article className="bubble">
                  <p>{entry.ask.question}</p>
                </article>
                <div className="bubble-actions">
                  <button type="button" onClick={() => setRecalling({ kind: "ask", id: entry.ask.id })}>
                    撤回
                  </button>
                </div>
              </div>
              <div className="msg in">
                <article className="bubble in">
                  <p>{entry.ask.answer}</p>
                </article>
                <div className="bubble-actions">
                  {entry.ask.fragmentId ? (
                    <span>已记</span>
                  ) : (
                    <button type="button" onClick={() => void keep(entry.ask)}>
                      记进日记
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
          <div className="msg" key={entry.fragment.id}>
            <time className="stamp">{entry.fragment.createdAt ? shanghaiClock(new Date(entry.fragment.createdAt)) : ""}</time>
            {entry.fragment.body ? (
              <article className="bubble">
                <p>{entry.fragment.body}</p>
              </article>
            ) : null}
            {entry.fragment.media.length > 0 ? (
              <div className={entry.fragment.media.length > 1 ? "shots many" : "shots"}>
                {entry.fragment.media.map((file) => {
                  const src = localUrls[file.id] ?? urls[file.id];
                  if (file.kind === "photo" && src) return <ZoomPhoto key={file.id} src={src} />;
                  if (file.kind === "video" && src) return <video key={file.id} src={src} controls />;
                  return <span key={file.id}>{file.kind === "photo" ? "照片" : "视频"}</span>;
                })}
              </div>
            ) : null}
            <div className="bubble-actions">
              {entry.fragment.body ? (
                <button type="button" onClick={() => openEdit(entry.fragment)}>
                  修改
                </button>
              ) : null}
              <button type="button" onClick={() => setRecalling({ kind: "note", id: entry.fragment.id })}>
                撤回
              </button>
            </div>
          </div>
          ),
        )}
        {waiting ? (
          <div className="msg in">
            <article className="bubble in">
              <p>在想…</p>
            </article>
          </div>
        ) : null}
      </div>
      <div className="dock">
        {error ? (
          <Alert className="error" severity="error" sx={{ py: 0 }}>
            {error}
          </Alert>
        ) : null}
        {attached.length > 0 ? (
          <div className="pending-files">
            {attached.map((file) => (
              <button key={file.id} type="button" onClick={() => setAttached((current) => current.filter((entry) => entry.id !== file.id))}>
                {file.preview ? <img src={file.preview} alt="" /> : "视频"}
                <span>去掉</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className={emojiOpen ? "picker open" : "picker"} role="listbox" aria-label="表情和颜文字">
          {FACES.map((token) => (
            <button key={token} type="button" onClick={() => insert(token)}>
              {token}
            </button>
          ))}
          <div className="kaomoji">
            {KAOMOJI.map((token) => (
              <button key={token} type="button" onClick={() => insert(token)}>
                {token}
              </button>
            ))}
          </div>
        </div>
        <div className={moreOpen ? "attach open" : "attach"}>
          <label>
            <ImageOutlinedIcon />
            发送图片
            <input
              aria-label="照片"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                void addPhotos(event.target.files);
                event.target.value = "";
                setMoreOpen(false);
              }}
            />
          </label>
          <label>
            <VideocamOutlinedIcon />
            发送视频
            <input
              aria-label="视频"
              type="file"
              accept="video/*"
              onChange={(event) => {
                addVideo(event.target.files?.[0]);
                event.target.value = "";
                setMoreOpen(false);
              }}
            />
          </label>
        </div>
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="composer-row">
            <div className="field">
              <TextareaAutosize
                ref={inputRef}
                className="composer-input"
                value={text}
                minRows={1}
                maxRows={6}
                onChange={(event) => setText(event.target.value)}
                placeholder={mode === "ask" ? "问一句…" : "记一笔…"}
                aria-label={mode === "ask" ? "问一句" : "记一笔"}
              />
              <div className="field-tools">
                <div className="mode">
                  <button type="button" aria-pressed={mode === "note"} onClick={() => setMode("note")}>
                    记
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "ask"}
                    onClick={() => {
                      setMode("ask");
                      setMoreOpen(false);
                    }}
                  >
                    问
                  </button>
                </div>
                {mode === "note" ? (
                  <button
                    type="button"
                    className="tool"
                    aria-label="更多"
                    data-popup-toggle=""
                    aria-pressed={moreOpen}
                    onClick={() => {
                      setMoreOpen((open) => !open);
                      setEmojiOpen(false);
                    }}
                  >
                    <AddIcon />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="tool"
                  aria-label="表情"
                  data-popup-toggle=""
                  aria-pressed={emojiOpen}
                  onClick={() => {
                    setEmojiOpen((open) => !open);
                    setMoreOpen(false);
                  }}
                >
                  <MoodOutlinedIcon />
                </button>
                <button type="button" className="tool" aria-label="语音" aria-pressed={listening} onClick={listen}>
                  <MicNoneIcon />
                </button>
                <button type="submit" className="send" aria-label="发送" disabled={!canSend || pending || waiting}>
                  <SendRoundedIcon />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      {editing ? (
        <div
          className="edit-layer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <form
            className="edit-card"
            role="dialog"
            aria-label="修改这条"
            onSubmit={(event) => {
              event.preventDefault();
              void commitEdit();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setEditing(null);
            }}
          >
            <p className="edit-label">修改这条</p>
            <TextareaAutosize
              className="composer-input edit-input"
              value={draft}
              minRows={3}
              maxRows={8}
              autoFocus
              aria-label="修改内容"
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="edit-actions">
              <button type="button" onClick={() => setEditing(null)}>
                取消
              </button>
              <button type="submit" className="edit-save">
                保存
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {recalling ? (
        <div
          className="edit-layer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setRecalling(null);
          }}
        >
          <div className="edit-card" role="dialog" aria-label="确认撤回" onKeyDown={(event) => event.key === "Escape" && setRecalling(null)}>
            <p className="confirm-copy">撤回后，这条就从今天去掉了。</p>
            <div className="edit-actions">
              <button type="button" onClick={() => setRecalling(null)}>
                取消
              </button>
              <button type="button" className="edit-save" onClick={() => void confirmRecall()}>
                撤回
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = targetImageSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(bitmap, 0, 0, size.width, size.height);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  return blob ?? file;
}
