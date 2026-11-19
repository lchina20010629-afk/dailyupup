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
    palette: {
      mode: "light",
      primary: { main: "#1f7a45", contrastText: "#ffffff" },
      background: { default: "#f7f4ef", paper: "#fffdfb" },
      text: { primary: "#1f1c19", secondary: "#8e877c" },
      divider: "rgba(31, 28, 25, 0.08)",
    },
  }),
  ink: createTheme({
    ...shared,
    palette: {
      mode: "dark",
      primary: { main: "#8dcea8", contrastText: "#142018" },
      background: { default: "#141311", paper: "#1e1c19" },
      text: { primary: "#f4f0e8", secondary: "#a8a094" },
      divider: "rgba(244, 240, 232, 0.1)",
    },
  }),
  tide: createTheme({
    ...shared,
    palette: {
      mode: "light",
      primary: { main: "#0e7c6b", contrastText: "#ffffff" },
      background: { default: "#f3f6f5", paper: "#ffffff" },
      text: { primary: "#14211e", secondary: "#6f7d78" },
      divider: "rgba(20, 33, 30, 0.08)",
    },
  }),
  night: createTheme({
    ...shared,
    palette: {
      mode: "dark",
      primary: { main: "#9db4ff", contrastText: "#10141f" },
      background: { default: "#0f1218", paper: "#181c26" },
      text: { primary: "#eef1f6", secondary: "#9aa3b5" },
      divider: "rgba(238, 241, 246, 0.1)",
    },
  }),
};

export function themeChoice(saved: string | null): ThemeId {
  return THEME_IDS.find((id) => id === saved) ?? "paper";
}
