import { createTheme, type Theme } from "@mui/material/styles";

export const THEME_IDS = ["paper", "ink", "tide", "night"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_LABELS: Record<ThemeId, string> = {
  paper: "纸",
  ink: "墨",
  tide: "青",
  night: "夜",
};

const shared = {
  cssVariables: true,
  spacing: 4,
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Segoe UI", sans-serif',
    fontSize: 14,
    h1: { fontSize: "1.15rem", fontWeight: 600, lineHeight: 1.3 },
  },
};

export const THEMES: Record<ThemeId, Theme> = {
  paper: createTheme({
    ...shared,
    palette: { mode: "light", primary: { main: "#1e3a34" }, background: { default: "#f4f1eb", paper: "#fffdf8" } },
  }),
  ink: createTheme({
    ...shared,
    palette: { mode: "dark", primary: { main: "#8fbfa8" }, background: { default: "#121614", paper: "#1c2420" } },
  }),
  tide: createTheme({
    ...shared,
    palette: { mode: "light", primary: { main: "#0f766e" }, background: { default: "#f2f7f6", paper: "#ffffff" } },
  }),
  night: createTheme({
    ...shared,
    palette: { mode: "dark", primary: { main: "#9db4ff" }, background: { default: "#10131a", paper: "#1a2030" } },
  }),
};

export function themeChoice(saved: string | null): ThemeId {
  return THEME_IDS.find((id) => id === saved) ?? "paper";
}
