"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { THEMES, themeChoice, type ThemeId } from "@/lib/themes";

const STORAGE_KEY = "dr-theme";

const ThemeChoice = createContext<{ id: ThemeId; set: (id: ThemeId) => void }>({
  id: "paper",
  set: () => {},
});

export function useThemeChoice() {
  return useContext(ThemeChoice);
}

export function Providers({ children }: { children: ReactNode }) {
  const [id, setId] = useState<ThemeId>("paper");
  useEffect(() => {
    const next = themeChoice(localStorage.getItem(STORAGE_KEY));
    setId(next);
    document.documentElement.dataset.theme = next;
  }, []);

  function set(next: ThemeId) {
    setId(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <AppRouterCacheProvider>
      <ThemeChoice.Provider value={{ id, set }}>
        <ThemeProvider theme={THEMES[id]}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeChoice.Provider>
    </AppRouterCacheProvider>
  );
}
