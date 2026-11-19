import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "日常记录",
  applicationName: "日常记录",
  appleWebApp: { capable: true, title: "日常记录", statusBarStyle: "default" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#f7f4ef",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="paper">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
