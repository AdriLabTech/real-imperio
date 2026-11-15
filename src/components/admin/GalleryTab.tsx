"use client";
/* eslint-disable @next/next/no-img-element -- vistas previas locales (blob:) del panel */

import { useState } from "react";
import { CATEGORIAS, newId, ytId, isVideoName, type GalleryDraft, type Categoria } from "@/lib/admin/model";
import type { GitHub } from "@/lib/admin/github";
import { Area, Btn, Card, Errors, Field, RemoteImg, Select, Text, MAX_VIDEO_MB, readVideo, resizeImage, safeName } from "./ui";

export function GalleryTab({ gh, list, setList }: { gh: GitHub; list: GalleryDraft[]; setList: (l: GalleryDraft[]) => void }) {
  const [cat, setCat] = useState<Categoria>("partidos");
  const [yt, setYt] = useState({ url: "", titulo: "" });
  const [err, setErr] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (id: string, patch: Partial<GalleryDraft>) => setList(list.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return; setBusy(true); setErr([]);
    const add: GalleryDraft[] = []; const errs: string[] = [];
    for (const f of [...files]) {
      try {
        const video = /^video\//.test(f.type) || isVideoName(f.name);
        if (video) { const r = await readVideo(f); add.push({ id: newId(), kind: "file", category: cat, titulo: "", descripcion: "", newFile: { name: safeName(f.name), ...r, video: true } }); }
        else { const r = await resizeImage(f, 1800); add.push({ id: newId(), kind: "file", category: cat, titulo: "", descripcion: "", newFile: { name: safeName(f.name.replace(/\.[^.]+$/, "")) + ".jpg", ...r, video: false } }); }
      } catch (e) { errs.push(e instanceof Error ? e.message : `No se pudo leer «${f.name}».`); }
    }
    setList([...add, ...list]); setErr(errs); setBusy(false);
  };
  const addYt = () => {
    if (!ytId(yt.url)) return setErr(["Ese enlace no parece de YouTube (youtu.be/… o youtube.com/watch?v=…)."]);
    if (!yt.titulo.trim()) return setErr(["Pon un título al vídeo."]);
    setErr([]); setList([{ id: newId(), kind: "youtube", category: cat, titulo: yt.titulo.trim(), descripcion: "", url: yt.url.trim() }, ...list]); setYt({ url: "", titulo: "" });
  };

  return (
    <div>
      <Card className="mb-6 grid gap-4 sm:grid-cols-[1fr_2fr]">
        <div>
          <Field label="Categoría de lo que vas a añadir"><Select value={cat} onChange={(e) => setCat(e.target.value as Categoria)}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <label className={`mono mt-3 block cursor-pointer border border-paper/30 px-4 py-3 text-center hover:border-primary hover:text-primary ${busy ? "opacity-50" : ""}`}>
            {busy ? "Procesando…" : "Subir fotos o vídeos"}
            <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple disabled={busy} className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </label>
          <p className="mt-2 text-xs text-muted">Las fotos se reducen a 1800 px. Vídeos propios hasta {MAX_VIDEO_MB} MB; para más, usa YouTube.</p>
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <Field label="Enlace de YouTube" className="sm:col-span-2"><Text value={yt.url} onChange={(e) => setYt({ ...yt, url: e.target.value })} placeholder="https://youtu.be/…" /></Field>
          <Field label="Título"><Text value={yt.titulo} onChange={(e) => setYt({ ...yt, titulo: e.target.value })} /></Field>
          <div className="flex items-end"><Btn kind="gold" className="w-full" onClick={addYt}>Añadir vídeo de YouTube</Btn></div>
        </div>
      </Card>
      <Errors list={err} />
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((g) => (
          <li key={g.id}>
            <Card className="flex gap-4">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-ink">
                {g.newFile ? (g.newFile.video ? <video src={g.newFile.preview} muted className="size-full object-cover" /> : <img src={g.newFile.preview} alt="" className="size-full object-cover" />)
                  : g.kind === "youtube" ? <span className="grid size-full place-items-center text-center text-xs text-muted">▶ YouTube</span>
                  : isVideoName(g.file!.name) ? <span className="grid size-full place-items-center text-center text-xs text-muted">▶ vídeo</span> : <RemoteImg gh={gh} sha={g.file!.sha} className="size-full" />}
                {g.newFile && <span className="mono absolute left-0 top-0 bg-primary px-1.5 py-0.5 !text-[0.6rem] text-ink">NUEVO</span>}
              </div>
              <div className="grid min-w-0 flex-1 gap-2">
                <Text value={g.titulo} onChange={(e) => set(g.id, { titulo: e.target.value })} placeholder={g.file?.name ?? g.newFile?.name ?? "Título"} aria-label="Título" />
                <Text value={g.descripcion} onChange={(e) => set(g.id, { descripcion: e.target.value })} placeholder="Descripción (opcional)" aria-label="Descripción" />
                <div className="flex gap-2">
                  <Select value={g.category} onChange={(e) => set(g.id, { category: e.target.value as Categoria })} aria-label="Categoría">{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</Select>
                  <Btn kind="danger" onClick={() => { if (confirm("¿Eliminar este elemento de la galería?")) setList(list.filter((x) => x.id !== g.id)); }}>Quitar</Btn>
                </div>
              </div>
            </Card>
          </li>
        ))}
        {list.length === 0 && <li className="text-muted">La galería está vacía.</li>}
      </ul>
    </div>
  );
}
