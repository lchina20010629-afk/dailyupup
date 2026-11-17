export function buildManifest() {
  return {
    name: "日常记录" as const,
    short_name: "日常" as const,
    display: "standalone" as const,
    start_url: "/today" as const,
    lang: "zh-CN" as const,
    background_color: "#f6f4ef",
    theme_color: "#9a3412",
    icons: [
      { src: "/icons/192", sizes: "192x192" as const, type: "image/png" as const },
      { src: "/icons/512", sizes: "512x512" as const, type: "image/png" as const },
    ],
  };
}
