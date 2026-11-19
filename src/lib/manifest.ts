export function buildManifest() {
  return {
    name: "日常记录" as const,
    short_name: "日常" as const,
    display: "standalone" as const,
    start_url: "/today" as const,
    lang: "zh-CN" as const,
    background_color: "#f7f4ef",
    theme_color: "#f7f4ef",
    icons: [
      { src: "/icon-192.png", sizes: "192x192" as const, type: "image/png" as const, purpose: "any" as const },
      { src: "/icon-512.png", sizes: "512x512" as const, type: "image/png" as const, purpose: "any" as const },
      { src: "/icon-192.png", sizes: "192x192" as const, type: "image/png" as const, purpose: "maskable" as const },
      { src: "/icon-512.png", sizes: "512x512" as const, type: "image/png" as const, purpose: "maskable" as const },
    ],
  };
}
