"use client";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { useThemeChoice } from "@/components/Providers";
import { THEME_IDS, THEME_LABELS, type ThemeId } from "@/lib/themes";

const SWATCH: Record<ThemeId, string> = {
  paper: "#1e3a34",
  ink: "#8fbfa8",
  tide: "#0f766e",
  night: "#9db4ff",
};

export function ThemeMenu() {
  const { id, set } = useThemeChoice();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <button type="button" className="theme-dot" aria-label={`主题 · ${THEME_LABELS[id]}`} onClick={(event) => setAnchor(event.currentTarget)}>
        <span style={{ background: SWATCH[id] }} />
      </button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {THEME_IDS.map((themeId) => (
          <MenuItem
            key={themeId}
            selected={themeId === id}
            onClick={() => {
              set(themeId);
              setAnchor(null);
            }}
          >
            {THEME_LABELS[themeId]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
