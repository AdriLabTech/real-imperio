"use client";

import { newId, type MatchDraft } from "@/lib/admin/model";
import { Area, Btn, Card, Field, Select, Text } from "./ui";

export function MatchesTab({ list, setList }: { list: MatchDraft[]; setList: (l: MatchDraft[]) => void }) {
  const set = (id: string, patch: Partial<MatchDraft>) => setList(list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const add = () => {
    const d = new Date(Date.now() + 7 * 864e5); d.setMinutes(0, 0, 0);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setList([{ id: newId(), fecha: local, rival: "", local: true, lugar: "", competicion: "", a: "", b: "", nota: "" }, ...list]);
  };
  const sorted = [...list].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">Pon el marcador para que el partido pase a «resultados». Hora de Madrid.</p>
        <Btn kind="gold" onClick={add}>+ Añadir partido</Btn>
      </div>
      <ul className="space-y-3">
        {sorted.map((m) => (
          <li key={m.id}>
            <Card className="grid gap-4 sm:grid-cols-6">
              <Field label="Fecha y hora *" className="sm:col-span-2"><Text type="datetime-local" value={m.fecha} onChange={(e) => set(m.id, { fecha: e.target.value })} /></Field>
              <Field label="Rival *" className="sm:col-span-2"><Text value={m.rival} onChange={(e) => set(m.id, { rival: e.target.value })} /></Field>
              <Field label="Condición" className="sm:col-span-2"><Select value={m.local ? "local" : "fuera"} onChange={(e) => set(m.id, { local: e.target.value === "local" })}><option value="local">Local</option><option value="fuera">Visitante</option></Select></Field>
              <Field label="Lugar" className="sm:col-span-2"><Text value={m.lugar} onChange={(e) => set(m.id, { lugar: e.target.value })} /></Field>
              <Field label="Competición" className="sm:col-span-2"><Text value={m.competicion} onChange={(e) => set(m.id, { competicion: e.target.value })} placeholder="Liga, Copa, Amistoso…" /></Field>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <Field label="Goles nuestros"><Text inputMode="numeric" maxLength={2} value={m.a} onChange={(e) => set(m.id, { a: e.target.value })} /></Field>
                <Field label="Goles rival"><Text inputMode="numeric" maxLength={2} value={m.b} onChange={(e) => set(m.id, { b: e.target.value })} /></Field>
              </div>
              <Field label="Nota (opcional)" className="sm:col-span-5"><Area rows={1} value={m.nota} onChange={(e) => set(m.id, { nota: e.target.value })} /></Field>
              <div className="flex items-end sm:col-span-1"><Btn kind="danger" className="w-full" onClick={() => { if (confirm("¿Eliminar este partido?")) setList(list.filter((x) => x.id !== m.id)); }}>Eliminar</Btn></div>
            </Card>
          </li>
        ))}
        {list.length === 0 && <li className="text-muted">Todavía no hay partidos.</li>}
      </ul>
    </div>
  );
}
