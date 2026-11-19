"use client";

import { useEffect, useRef, useState } from "react";

export function ZoomPhoto({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="shot" aria-label="查看图片" onClick={() => setOpen(true)}>
        <img src={src} alt="" />
      </button>
      {open ? <PhotoStage src={src} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function PhotoStage({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ scale: number; dist: number; x: number; y: number; px: number; py: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const stage = stageRef.current;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      setScale((current) => clamp(current + (event.deltaY < 0 ? 0.15 : -0.15)));
    }
    stage?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      stage?.removeEventListener("wheel", onWheel);
    };
  }, [onClose]);

  function zoomBy(delta: number) {
    setScale((current) => {
      const next = clamp(current + delta);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLImageElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    rememberGesture();
  }

  function onPointerMove(event: React.PointerEvent<HTMLImageElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    if (points.length >= 2) {
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      setScale(clamp(gesture.current.scale * (dist / gesture.current.dist)));
      return;
    }
    setPan({
      x: gesture.current.px + event.clientX - gesture.current.x,
      y: gesture.current.py + event.clientY - gesture.current.y,
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLImageElement>) {
    pointers.current.delete(event.pointerId);
    rememberGesture();
  }

  function rememberGesture() {
    const points = [...pointers.current.values()];
    if (points.length === 0) {
      gesture.current = null;
      return;
    }
    const dist = points.length >= 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 1;
    gesture.current = { scale, dist, x: points[0].x, y: points[0].y, px: pan.x, py: pan.y };
  }

  return (
    <div
      className="viewer"
      ref={stageRef}
      role="dialog"
      aria-label="查看图片"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotate(${rotate}deg)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="viewer-bar">
        <button type="button" onClick={() => zoomBy(-0.25)}>
          缩小
        </button>
        <button type="button" onClick={() => zoomBy(0.25)}>
          放大
        </button>
        <button type="button" onClick={() => setRotate((current) => current + 90)}>
          旋转
        </button>
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}

function clamp(value: number) {
  return Math.min(4, Math.max(1, Math.round(value * 100) / 100));
}
