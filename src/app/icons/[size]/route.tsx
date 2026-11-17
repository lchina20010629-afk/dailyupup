import { ImageResponse } from "next/og";

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size } = await context.params;
  const pixels = size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f4ef",
          color: "#9a3412",
          fontSize: pixels / 4,
        }}
      >
        记
      </div>
    ),
    { width: pixels, height: pixels },
  );
}
