"use client";

import { useState } from "react";
import { showInstallHint } from "@/lib/installHint";

export function InstallHint() {
  const [dismissed, setDismissed] = useState(false);
  const standalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
  if (!showInstallHint({ standalone, dismissed: dismissed || readDismissed() })) return null;
  return (
    <p className="hint">
      <span>用 Safari 的「添加到主屏幕」，之后会像一个应用一样打开。</span>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem("dr-install-dismissed", "1");
          setDismissed(true);
        }}
      >
        知道了
      </button>
    </p>
  );
}

function readDismissed(): boolean {
  return typeof window !== "undefined" && localStorage.getItem("dr-install-dismissed") === "1";
}
