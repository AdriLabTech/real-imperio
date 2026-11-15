import { club } from "@/config/club";
import type { MatchRequestInput } from "./validation";

const TYPE_LABEL: Record<string, string> = { amistoso: "Amistoso", torneo: "Torneo", otro: "Otro" };

function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Mensaje de WhatsApp con solo los campos rellenados (formato en negrita de WhatsApp: *texto*). */
export function buildMessage(d: MatchRequestInput): string {
  const rows: [string, string | undefined][] = [
    ["Equipo", d.teamName],
    ["Fecha propuesta", longDate(d.proposedDate)],
    ["Tipo de partido", d.matchType ? TYPE_LABEL[d.matchType] : undefined],
    ["Lugar propuesto", d.venue],
    ["Localidad", d.city],
    ["Persona de contacto", d.contactName],
    ["Teléfono", d.phone],
    ["Correo", d.email],
    ["Comentarios", d.comments],
  ];
  return [`⚽ *Propuesta de partido para ${club.name} ${club.suffix}*`, "", ...rows.filter(([, v]) => v).map(([k, v]) => `*${k}:* ${v}`)].join("\n");
}

export const whatsappUrl = (d: MatchRequestInput) => `https://wa.me/${club.whatsapp.number}?text=${encodeURIComponent(buildMessage(d))}`;
