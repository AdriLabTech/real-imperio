/**
 * Identidad del club: el ÚNICO sitio donde se cambian nombre, colores, contacto y redes.
 * Jugadores, partidos y fotos/vídeos NO se editan aquí: ver carpeta /content y README.
 */
import ajustes from "../../content/ajustes.json";

export interface Social { id: string; label: string; handle: string; url: string }

export const club = {
  name: "Real Imperio",
  suffix: "F.C.",
  shortName: "RI",
  slogan: "Negro y oro. Así se juega.",
  tagline: "Real Imperio F.C. · Fútbol con carácter.",
  /** Colores: negro (base) y oro (acento). Se inyectan como variables CSS. */
  colors: {
    ink: "#0a0a09", // negro base
    paper: "#f1ebdc", // texto claro
    primary: "#d9ad2b", // oro
    secondary: "#ef5b44", // rojo señal: solo errores y detalles puntuales
  },
  /** Escudo real: ruta dentro de /public (p. ej. "/escudo.svg"). null = escudo generado con las iniciales. */
  crestSrc: null as string | null,
  /** WhatsApp y redes: se editan en content/ajustes.json (o desde el panel /admin). */
  whatsapp: ajustes.whatsapp as { number: string; display: string },
  socials: ajustes.socials as readonly Social[],
} as const;

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
/** Prefijo de GitHub Pages (p. ej. "/real-imperio"). Lo pone el workflow; vacío en local. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Convierte una ruta de /public ("/jugadores/x.jpg") en una URL válida también bajo GitHub Pages. */
export const asset = (p: string) => (p.startsWith("/") ? `${basePath}${p}` : p);
