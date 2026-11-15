import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/club";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
