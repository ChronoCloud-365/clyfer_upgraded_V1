import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Clyfar Fashion — Premium Footwear";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const logoData = readFileSync(join(process.cwd(), "public", "logo.jpeg"));
  const logoSrc = `data:image/jpeg;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 60%, #0d0d0d 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "80px 100px",
          gap: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <img
          src={logoSrc}
          width={220}
          height={220}
          style={{
            borderRadius: "28px",
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          }}
        />

        {/* Text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
          {/* CLYFAR */}
          <div style={{ display: "flex", alignItems: "baseline", lineHeight: 1 }}>
            <span style={{ fontSize: 88, fontWeight: 900, color: "#ffffff", letterSpacing: "-3px" }}>
              CLY
            </span>
            <span style={{ fontSize: 88, fontWeight: 900, color: "#f59e0b", letterSpacing: "-3px" }}>
              FAR
            </span>
          </div>

          {/* Fashion subtitle */}
          <span style={{ fontSize: 30, color: "#9ca3af", fontWeight: 400, letterSpacing: "6px", textTransform: "uppercase", marginTop: "4px" }}>
            Fashion
          </span>

          {/* Divider */}
          <div style={{ width: "60px", height: "3px", background: "#f59e0b", borderRadius: "9999px", margin: "24px 0" }} />

          {/* Tagline */}
          <span style={{ fontSize: 26, color: "#d1d5db", fontWeight: 400, lineHeight: 1.5, maxWidth: "520px" }}>
            Step into your era. Premium footwear crafted for those who move forward.
          </span>

          {/* URL */}
          <span style={{ fontSize: 20, color: "#f59e0b", marginTop: "28px", fontWeight: 500 }}>
            www.clyfarfashion.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
