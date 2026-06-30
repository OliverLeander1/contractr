import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Contractr - Forstå din byggeaftale, inden det er for sent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f3d26 0%, #1a5c38 60%, #22784a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div style={{
            width: 56, height: 56,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span style={{ color: "white", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>Contractr</span>
        </div>

        {/* Headline */}
        <div style={{ color: "white", fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, maxWidth: 800 }}>
          Forstå din byggeaftale, inden det er for sent
        </div>

        {/* Subline */}
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 26, lineHeight: 1.4, maxWidth: 700, marginBottom: 56 }}>
          Gratis AI-screening af dit tilbud eller kontrakt mod AB-Forbruger 2012
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 16 }}>
          {["2 min", "100% fortroligt", "Gratis"].map((b) => (
            <div key={b} style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 100,
              padding: "10px 24px",
              color: "white",
              fontSize: 18,
              fontWeight: 600,
            }}>
              {b}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
