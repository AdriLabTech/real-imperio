export const NAV_ALL = [
  { id: "club", label: "El club" },
  { id: "plantilla", label: "Plantilla" },
  { id: "galeria", label: "Galería" },
  { id: "partidos", label: "Partidos" },
  { id: "contacto", label: "Proponer partido" },
  { id: "comunidad", label: "Comunidad" },
] as const;
export type NavItem = { id: string; label: string };
