"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check, MessageCircle } from "lucide-react";
import Link from "next/link";
import { club } from "@/config/club";
import { useEffect, useRef, useState } from "react";
import { type FieldErrors, validateMatchRequest } from "@/lib/validation";
import { whatsappUrl } from "@/lib/whatsapp";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHead } from "./SectionHead";

const today = () => new Date().toISOString().slice(0, 10);

interface FieldProps {
  name: string; label: string; required?: boolean; type?: string; error?: string; value?: string; textarea?: boolean;
  autoComplete?: string; inputMode?: "text" | "email" | "tel"; maxLength?: number; min?: string; hint?: string;
  onBlurField: (name: string, value: string) => void; valid?: boolean;
}

function Field({ name, label, required, type = "text", error, value, textarea, autoComplete, inputMode, maxLength, min, hint, onBlurField, valid }: FieldProps) {
  const id = `f-${name}`;
  const [focus, setFocus] = useState(false);
  const common = {
    id, name, defaultValue: value, required, autoComplete, inputMode, maxLength, min,
    "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined,
    onFocus: () => setFocus(true),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { setFocus(false); onBlurField(name, e.currentTarget.value); },
    className: "peer w-full bg-transparent px-0 pb-3 pt-7 text-lg text-paper outline-none placeholder-transparent [color-scheme:dark]",
    placeholder: label,
  };
  return (
    <div className="relative">
      <div className="relative border-b border-paper/25">
        {textarea ? <textarea {...common} rows={4} className={`${common.className} resize-none`} /> : <input {...common} type={type} />}
        <label htmlFor={id} className="mono pointer-events-none absolute left-0 top-6 origin-left text-muted transition-all duration-300 peer-focus:top-1 peer-focus:!text-[0.62rem] peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:!text-[0.62rem]">
          {label}{required && <span className="text-secondary"> *</span>}
        </label>
        <motion.span className={`absolute bottom-[-1px] left-0 h-[2px] ${error ? "bg-secondary" : "bg-primary"}`} initial={false} animate={{ width: focus || error ? "100%" : valid ? "100%" : "0%", opacity: valid && !focus && !error ? 0.5 : 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        <AnimatePresence>
          {valid && !error && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-0 top-8 text-primary" aria-hidden><Check size={18} /></motion.span>}
          {error && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-0 top-8 text-secondary" aria-hidden><AlertCircle size={18} /></motion.span>}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {error ? (
          <motion.p id={`${id}-err`} role="alert" initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mono mt-2 !normal-case !tracking-wide !text-[0.8rem] text-secondary">{error}</motion.p>
        ) : hint ? <p id={`${id}-hint`} className="mono mt-2 !normal-case !tracking-wide !text-[0.75rem] text-muted">{hint}</p> : null}
      </AnimatePresence>
    </div>
  );
}

export function Contact() {
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [okFields, setOkFields] = useState<Record<string, boolean>>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({}); // conserva lo escrito al editar tras enviar
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [typeSel, setTypeSel] = useState("amistoso");

  useEffect(() => { if (sentUrl) successRef.current?.focus(); }, [sentUrl]);

  const formValues = () => Object.fromEntries(new FormData(formRef.current!) as unknown as Iterable<[string, string]>) as Record<string, string>;

  // Validación por campo al salir de él (misma función zod que usa el envío).
  const onBlurField = (name: string, value: string) => {
    if (!formRef.current) return;
    const r = validateMatchRequest({ ...formValues(), [name]: value });
    const err = r.ok ? undefined : r.errors[name as keyof FieldErrors];
    setClientErrors((c) => ({ ...c, [name]: err }));
    setOkFields((o) => ({ ...o, [name]: !err && value.trim() !== "" }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = validateMatchRequest(formValues());
    if (!r.ok) {
      setClientErrors(r.errors);
      document.getElementById(`f-${Object.keys(r.errors)[0]}`)?.focus();
      return;
    }
    setClientErrors({});
    setSaved(formValues());
    const url = whatsappUrl(r.data);
    setSentUrl(url);
    window.open(url, "_blank", "noopener,noreferrer"); // gesto del usuario: el navegador lo permite
  };

  const errors = clientErrors;

  return (
    <section id="contacto" className="relative overflow-hidden bg-primary py-28 text-ink md:py-40" aria-label="Proponer un partido">
      <div className="pitch-lines absolute inset-0 !opacity-[0.12] [filter:invert(1)]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 size-[46rem] -translate-y-1/2 rounded-full border-[3px] border-ink/15" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 h-[46rem] w-px -translate-y-1/2 bg-ink/15" />

      <div className="gutter relative grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="[&_*]:!text-ink [&_.bg-primary\/60]:!bg-ink/50"><SectionHead index="05" kicker="Proponer partido" title="¿Jugamos?" /></div>
          <Reveal delay={0.15}><p className="mt-8 max-w-sm text-lg leading-relaxed text-ink/80">Si tu equipo quiere medirse con nosotros, cuéntanos cuándo y dónde. Solo necesitamos el nombre del equipo y una fecha; el resto es para facilitarlo todo.</p></Reveal>
          <Reveal delay={0.25}>
            <ul className="mono mt-10 space-y-2 !normal-case !tracking-wide !text-sm text-ink/80">
              <li>— Al enviar se abre WhatsApp con el mensaje ya redactado.</li>
              <li>— La propuesta llega cuando pulses «Enviar» en WhatsApp.</li>
              <li>— No guardamos tus datos: más en la <Link href="/privacidad" className="underline underline-offset-4">política de privacidad</Link>.</li>
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <div className="relative bg-ink p-6 text-paper sm:p-10 clip-cut">
            <AnimatePresence mode="wait">
              {sentUrl ? (
                <motion.div key="ok" ref={successRef} tabIndex={-1} role="status" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-6 outline-none">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="grid size-20 place-items-center rounded-full bg-primary text-ink"><MessageCircle size={36} strokeWidth={2.5} /></motion.div>
                  <h3 className="display mt-8 text-[clamp(2.4rem,6vw,4.4rem)]">Ya casi está.</h3>
                  <p className="mt-4 max-w-md text-lg text-muted">Hemos abierto WhatsApp con tu propuesta escrita. <strong className="text-paper">Pulsa «Enviar» allí para que nos llegue</strong>: hasta ese momento no se ha enviado nada.</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="mono clip-cut bg-primary px-6 py-4 text-ink hover:bg-paper">Abrir WhatsApp otra vez →</a>
                    <button onClick={() => { setSentUrl(null); }} className="mono border border-paper/30 px-5 py-4 hover:border-primary hover:text-primary">Editar propuesta</button>
                  </div>
                  <p className="mono mt-6 !normal-case !tracking-wide !text-xs text-muted">¿No se ha abierto? Escríbenos directamente al {club.whatsapp.display}.</p>
                </motion.div>
              ) : (
                <motion.form key="form" ref={formRef} onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-label="Formulario para proponer un partido">
                  <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    <div className="sm:col-span-2"><Field name="teamName" label="Nombre de tu equipo" required autoComplete="organization" maxLength={80} error={errors.teamName} value={saved.teamName} valid={okFields.teamName} onBlurField={onBlurField} /></div>
                    <Field name="proposedDate" label="Fecha propuesta" required type="date" min={today()} error={errors.proposedDate} value={saved.proposedDate} valid={okFields.proposedDate} onBlurField={onBlurField} />
                    <fieldset>
                      <legend className="mono pt-6 text-muted">Tipo de partido</legend>
                      <div className="mt-3 flex gap-2">
                        {[["amistoso", "Amistoso"], ["torneo", "Torneo"], ["otro", "Otro"]].map(([v, l]) => (
                          <label key={v} className={`mono cursor-pointer border px-3 py-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${typeSel === v ? "border-primary bg-primary text-ink" : "border-paper/25 hover:border-primary"}`}>
                            <input type="radio" name="matchType" value={v} checked={typeSel === v} onChange={() => setTypeSel(v)} className="sr-only" />{l}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <Field name="contactName" label="Persona de contacto" autoComplete="name" maxLength={80} error={errors.contactName} value={saved.contactName} valid={okFields.contactName} onBlurField={onBlurField} />
                    <Field name="email" label="Correo electrónico" type="email" inputMode="email" autoComplete="email" maxLength={120} error={errors.email} value={saved.email} valid={okFields.email} onBlurField={onBlurField} />
                    <Field name="phone" label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} error={errors.phone} value={saved.phone} valid={okFields.phone} onBlurField={onBlurField} />
                    <Field name="city" label="Localidad" autoComplete="address-level2" maxLength={80} error={errors.city} value={saved.city} valid={okFields.city} onBlurField={onBlurField} />
                    <div className="sm:col-span-2"><Field name="venue" label="Lugar propuesto para el partido" maxLength={120} error={errors.venue} value={saved.venue} valid={okFields.venue} onBlurField={onBlurField} /></div>
                    <div className="sm:col-span-2"><Field name="comments" label="Comentarios adicionales" textarea maxLength={1000} error={errors.comments} value={saved.comments} valid={okFields.comments} onBlurField={onBlurField} /></div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <p className="mono text-muted !normal-case !tracking-wide !text-xs"><span className="text-secondary">*</span> Obligatorio</p>
                    <Magnetic>
                      <button type="submit" className="mono clip-cut relative flex min-w-56 items-center justify-center gap-3 bg-primary px-8 py-5 text-ink transition-colors hover:bg-paper">
                        <MessageCircle size={18} /> Enviar por WhatsApp
                      </button>
                    </Magnetic>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
