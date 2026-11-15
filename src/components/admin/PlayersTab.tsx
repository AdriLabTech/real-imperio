"use client";
/* eslint-disable @next/next/no-img-element -- vistas previas locales (blob:) del panel */

import { useState } from "react";
import { POSICIONES, newId, type PlayerDraft } from "@/lib/admin/model";
import type { GitHub } from "@/lib/admin/github";
import { Area, Btn, Card, Errors, Field, RemoteImg, Select, Text, resizeImage } from "./ui";

export function PlayersTab({ gh, list, setList }: { gh: GitHub; list: PlayerDraft[]; setList: (l: PlayerDraft[]) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState<string[]>([]);
  const set = (id: string, patch: Partial<PlayerDraft>) => setList(list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const add = () => { const p: PlayerDraft = { id: newId(), nombre: "", posicion: "Delantero", dorsal: "", apodo: "", edad: "", altura: "", pie: "", nacionalidad: "", bio: "", stats: "" }; setList([...list, p]); setOpen(p.id); };
  const photo = async (id: string, f?: File) => {
    if (!f) return; setErr([]);
    try { const r = await resizeImage(f, 1400); set(id, { newPhoto: r, removePhoto: false }); } catch { setErr(["No se pudo leer esa imagen. Usa JPG, PNG o WebP."]); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">{list.length} jugadores. La posición y el nombre forman el nombre del archivo (<code>Nombre_Apellidos_Posicion</code>) automáticamente.</p>
        <Btn kind="gold" onClick={add}>+ Añadir jugador</Btn>
      </div>
      <Errors list={err} />
      <ul className="space-y-3">
        {list.map((p) => (
          <li key={p.id}>
            <Card>
              <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} className="flex w-full items-center gap-4 text-left" aria-expanded={open === p.id}>
                <span className="relative size-16 shrink-0 overflow-hidden bg-ink">
                  {p.newPhoto ? <img src={p.newPhoto.preview} alt="" className="size-full object-cover object-top" /> : p.photo && !p.removePhoto ? <RemoteImg gh={gh} sha={p.photo.sha} className="size-full object-top" /> : <span className="grid size-full place-items-center text-xs text-muted">sin foto</span>}
                </span>
                <span className="display w-12 text-3xl text-primary">{p.dorsal || "—"}</span>
                <span className="min-w-0 flex-1"><span className="display block truncate text-2xl">{p.nombre || "Jugador nuevo"}</span><span className="mono text-muted">{p.posicion}</span></span>
                <span className="mono text-muted">{open === p.id ? "Cerrar" : "Editar"}</span>
              </button>
              {open === p.id && (
                <div className="mt-5 grid gap-4 border-t border-paper/15 pt-5 sm:grid-cols-2">
                  <Field label="Nombre completo *"><Text value={p.nombre} onChange={(e) => set(p.id, { nombre: e.target.value })} placeholder="Juan Pérez García" /></Field>
                  <Field label="Posición *"><Select value={p.posicion} onChange={(e) => set(p.id, { posicion: e.target.value })}>{POSICIONES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
                  <Field label="Dorsal"><Text inputMode="numeric" maxLength={2} value={p.dorsal} onChange={(e) => set(p.id, { dorsal: e.target.value })} /></Field>
                  <Field label="Apodo"><Text value={p.apodo} onChange={(e) => set(p.id, { apodo: e.target.value })} /></Field>
                  <Field label="Edad"><Text inputMode="numeric" maxLength={2} value={p.edad} onChange={(e) => set(p.id, { edad: e.target.value })} /></Field>
                  <Field label="Altura"><Text value={p.altura} onChange={(e) => set(p.id, { altura: e.target.value })} placeholder="1,80 m" /></Field>
                  <Field label="Pie"><Select value={p.pie} onChange={(e) => set(p.id, { pie: e.target.value })}><option value="">—</option><option>Derecho</option><option>Izquierdo</option><option>Ambos</option></Select></Field>
                  <Field label="Nacionalidad"><Text value={p.nacionalidad} onChange={(e) => set(p.id, { nacionalidad: e.target.value })} /></Field>
                  <Field label="Breve descripción (sale en la lista de la plantilla)" className="sm:col-span-2"><Area value={p.bio} onChange={(e) => set(p.id, { bio: e.target.value })} /></Field>
                  <Field label="Estadísticas (una por línea: Nombre: 0-100)" className="sm:col-span-2"><Area value={p.stats} onChange={(e) => set(p.id, { stats: e.target.value })} placeholder={"Regate: 80\nRemate: 90"} /></Field>
                  <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                    <label className="mono cursor-pointer border border-paper/30 px-4 py-2.5 hover:border-primary hover:text-primary">
                      {p.photo || p.newPhoto ? "Cambiar foto" : "Subir foto"}
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => { photo(p.id, e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                    {(p.photo && !p.removePhoto) || p.newPhoto ? <Btn onClick={() => set(p.id, { newPhoto: undefined, removePhoto: !!p.photo })}>Quitar foto</Btn> : null}
                    <span className="flex-1" />
                    <Btn kind="danger" onClick={() => { if (confirm(`¿Eliminar a ${p.nombre || "este jugador"}? (se borra también su foto al publicar)`)) setList(list.filter((x) => x.id !== p.id)); }}>Eliminar jugador</Btn>
                  </div>
                </div>
              )}
            </Card>
          </li>
        ))}
        {list.length === 0 && <li className="text-muted">Todavía no hay jugadores.</li>}
      </ul>
    </div>
  );
}
