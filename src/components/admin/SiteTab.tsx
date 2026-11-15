"use client";

import { SOCIAL_IDS, displayPhone, type Ajustes, type ClubJson } from "@/lib/admin/model";
import { Area, Btn, Card, Field, Select, Text } from "./ui";

export function SiteTab({ club, setClub, ajustes, setAjustes }: { club: ClubJson; setClub: (c: ClubJson) => void; ajustes: Ajustes; setAjustes: (a: Ajustes) => void }) {
  const setVal = (i: number, patch: Partial<ClubJson["values"][number]>) => setClub({ ...club, values: club.values.map((v, j) => (j === i ? { ...v, ...patch } : v)) });
  const setSoc = (i: number, patch: Partial<Ajustes["socials"][number]>) => setAjustes({ ...ajustes, socials: ajustes.socials.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <div className="grid gap-6">
      <Card className="grid gap-4">
        <h3 className="display text-2xl">Contacto por WhatsApp</h3>
        <Field label="Número con prefijo de país, sin + ni espacios" hint={`Recibe las propuestas de partido. Se mostrará como: ${displayPhone(ajustes.whatsapp.number || "")}`}>
          <Text inputMode="numeric" value={ajustes.whatsapp.number} onChange={(e) => { const n = e.target.value.replace(/\D/g, ""); setAjustes({ ...ajustes, whatsapp: { number: n, display: displayPhone(n) } }); }} placeholder="34644250482" />
        </Field>
      </Card>
      <Card className="grid gap-4">
        <h3 className="display text-2xl">Redes sociales</h3>
        {ajustes.socials.map((s, i) => (
          <div key={i} className="grid gap-3 border-t border-paper/15 pt-4 sm:grid-cols-[9rem_1fr_1fr_1.6fr_auto] sm:items-end">
            <Field label="Red"><Select value={s.id} onChange={(e) => setSoc(i, { id: e.target.value, label: e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) })}>{SOCIAL_IDS.map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="Nombre visible"><Text value={s.label} onChange={(e) => setSoc(i, { label: e.target.value })} /></Field>
            <Field label="Usuario"><Text value={s.handle} onChange={(e) => setSoc(i, { handle: e.target.value })} placeholder="@usuario" /></Field>
            <Field label="Enlace (https://…)"><Text value={s.url} onChange={(e) => setSoc(i, { url: e.target.value })} /></Field>
            <Btn kind="danger" onClick={() => setAjustes({ ...ajustes, socials: ajustes.socials.filter((_, j) => j !== i) })}>Quitar</Btn>
          </div>
        ))}
        <div><Btn onClick={() => setAjustes({ ...ajustes, socials: [...ajustes.socials, { id: "tiktok", label: "TikTok", handle: "", url: "https://" }] })}>+ Añadir red social</Btn></div>
      </Card>
      <Card className="grid gap-4">
        <h3 className="display text-2xl">Sección «El club»</h3>
        <Field label="Frase de presentación"><Area value={club.manifesto} onChange={(e) => setClub({ ...club, manifesto: e.target.value })} /></Field>
        <div className="grid gap-3">
          <span className="mono text-muted">Valores</span>
          {club.values.map((v, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
              <Text value={v.word} onChange={(e) => setVal(i, { word: e.target.value })} placeholder="Palabra" aria-label="Palabra" />
              <Text value={v.text} onChange={(e) => setVal(i, { text: e.target.value })} placeholder="Explicación" aria-label="Explicación" />
              <Btn kind="danger" onClick={() => setClub({ ...club, values: club.values.filter((_, j) => j !== i) })}>Quitar</Btn>
            </div>
          ))}
          <div><Btn onClick={() => setClub({ ...club, values: [...club.values, { word: "", text: "" }] })}>+ Añadir valor</Btn></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <Field label="Cita destacada"><Text value={club.quote.text} onChange={(e) => setClub({ ...club, quote: { ...club.quote, text: e.target.value } })} /></Field>
          <Field label="Firmada por"><Text value={club.quote.by} onChange={(e) => setClub({ ...club, quote: { ...club.quote, by: e.target.value } })} /></Field>
        </div>
      </Card>
    </div>
  );
}
