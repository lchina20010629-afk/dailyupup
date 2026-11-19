"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { showInstallHint } from "@/lib/installHint";

export function InstallHint() {
  const [dismissed, setDismissed] = useState(false);
  const standalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
  if (!showInstallHint({ standalone, dismissed: dismissed || readDismissed() })) return null;
  return (
    <Stack className="hint" direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Typography variant="caption" sx={{ flex: 1 }}>
        用 Safari 的「添加到主屏幕」，之后会像一个应用一样打开。
      </Typography>
      <Button
        type="button"
        size="small"
        onClick={() => {
          localStorage.setItem("dr-install-dismissed", "1");
          setDismissed(true);
        }}
      >
        知道了
      </Button>
    </Stack>
  );
}

function readDismissed(): boolean {
  return typeof window !== "undefined" && localStorage.getItem("dr-install-dismissed") === "1";
}
