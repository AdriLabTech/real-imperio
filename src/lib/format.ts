const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", ...o });
export const dateLong = (iso: string) => fmt({ weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
export const dateShort = (iso: string) => fmt({ day: "2-digit", month: "short" }).format(new Date(iso)).replace(".", "");
export const timeOf = (iso: string) => fmt({ hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const dayNum = (iso: string) => fmt({ day: "2-digit" }).format(new Date(iso));
export const monthShort = (iso: string) => fmt({ month: "short" }).format(new Date(iso)).replace(".", "").toUpperCase();
export const weekday = (iso: string) => fmt({ weekday: "short" }).format(new Date(iso)).replace(".", "").toUpperCase();
