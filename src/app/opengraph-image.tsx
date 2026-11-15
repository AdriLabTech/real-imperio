import { ImageResponse } from "next/og";
import { club } from "@/config/club";

export const dynamic = "force-static";
export const alt = `${club.name} ${club.suffix}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: club.colors.ink, color: club.colors.paper, padding: 64 }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: club.colors.primary }}>{club.tagline.toUpperCase()}</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 220, fontWeight: 900, lineHeight: 0.85, textTransform: "uppercase" }}>
          <span>{club.name.split(" ")[0]}</span>
          <span style={{ color: club.colors.primary }}>{club.name.split(" ").slice(1).join(" ") || club.suffix}</span>
        </div>
        <div style={{ display: "flex", fontSize: 38 }}>{club.slogan}</div>
      </div>
    ),
    size,
  );
}
