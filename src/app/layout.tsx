import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "日常记录",
  appleWebApp: { capable: true, title: "日常记录", statusBarStyle: "default" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
