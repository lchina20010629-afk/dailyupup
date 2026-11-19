"use client";

import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { useThemeChoice } from "@/components/Providers";
import { THEME_IDS, THEME_LABELS } from "@/lib/themes";

export function ThemeMenu() {
  const { id, set } = useThemeChoice();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button size="small" color="primary" onClick={(event) => setAnchor(event.currentTarget)}>
        主题 · {THEME_LABELS[id]}
      </Button>
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
