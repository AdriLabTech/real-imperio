import type { NextConfig } from "next";

// Sitio 100 % estático para GitHub Pages: `next build` genera la carpeta /out.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default config;
