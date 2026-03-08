import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#04070d",
          color: "#f8fafc",
          fontFamily: "Inter"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 15%, rgba(52,211,153,0.27), transparent 36%), radial-gradient(circle at 82% 20%, rgba(56,189,248,0.24), transparent 34%)"
          }}
        />
        <div style={{ margin: "auto", width: "86%", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 30, color: "#67e8f9", letterSpacing: 2, textTransform: "uppercase" }}>Jungle Labs</div>
          <div style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 700, maxWidth: 980 }}>
            Building Intelligent Digital Systems for Modern Businesses
          </div>
          <div style={{ fontSize: 28, color: "#a7f3d0", maxWidth: 900 }}>
            AI Automation, Custom Software, CRM Systems, and Analytics Infrastructure
          </div>
        </div>
      </div>
    ),
    size
  );
}
