import { z } from "zod";

export const MATCH_TYPES = ["amistoso", "torneo", "otro"] as const;

/** Quita etiquetas, caracteres de control y espacios sobrantes. React ya escapa al renderizar; esto evita guardar basura. */
export function clean(input: string): string {
  return input
    .normalize("NFC")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028-\u202E]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const text = (max: number) => z.string().max(max, `Máximo ${max} caracteres`).transform(clean);
const optional = (max: number) =>
  z
    .string()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => clean(v))
    .transform((v) => (v === "" ? undefined : v))
    .optional();

const today = () => new Date().toISOString().slice(0, 10);

export const matchRequestSchema = z.object({
  teamName: text(80).pipe(z.string().min(2, "Indica el nombre de tu equipo")),
  proposedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Indica una fecha válida")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Indica una fecha válida")
    .refine((v) => v >= today(), "La fecha no puede ser pasada")
    .refine((v) => v <= `${new Date().getFullYear() + 2}-12-31`, "La fecha es demasiado lejana"),
  contactName: optional(80),
  email: optional(120).pipe(z.email("Correo no válido").optional()),
  phone: optional(30).pipe(
    z
      .string()
      .regex(/^[+\d][\d\s().-]{5,}$/, "Teléfono no válido")
      .optional(),
  ),
  city: optional(80),
  venue: optional(120),
  matchType: z.enum(MATCH_TYPES).optional().or(z.literal("").transform(() => undefined)),
  comments: z
    .string()
    .max(1000, "Máximo 1000 caracteres")
    .transform((v) => clean(v))
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
export type FieldErrors = Partial<Record<keyof MatchRequestInput, string>>;

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

/** Valida y devuelve datos limpios o errores por campo (mismo código en cliente y servidor). */
export function validateMatchRequest(raw: Record<string, string>) {
  const res = matchRequestSchema.safeParse(raw);
  if (res.success) return { ok: true as const, data: res.data };
  const errors: FieldErrors = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0] as keyof MatchRequestInput;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false as const, errors };
}
