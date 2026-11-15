import type { Metadata, Viewport } from "next";
import { Anton, Archivo, JetBrains_Mono } from "next/font/google";
import { club, siteUrl } from "@/config/club";
import { Providers } from "@/components/motion/Providers";
import { Cursor } from "@/components/layout/Cursor";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const title = `${club.name} ${club.suffix} — ${club.slogan}`;
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: `%s · ${club.name} ${club.suffix}` },
  description: `${club.tagline} Plantilla, galería, calendario y formulario para proponer un partido amistoso.`,
  openGraph: { title, description: club.tagline, type: "website", locale: "es_ES", siteName: club.name },
  twitter: { card: "summary_large_image", title, description: club.tagline },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: club.colors.ink, width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const vars = { ["--ink" as string]: club.colors.ink, ["--paper" as string]: club.colors.paper, ["--primary" as string]: club.colors.primary, ["--secondary" as string]: club.colors.secondary };
  return (
    <html lang="es" style={vars} className={`${anton.variable} ${archivo.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="mono sr-only z-[200] bg-primary px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar al contenido</a>
        <Providers>
          {children}
          <Cursor />
        </Providers>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
