"use client";

import { useEffect, useState } from "react";
import type { GitHub } from "@/lib/admin/github";

export const inputCls = "w-full border border-paper/25 bg-ink px-3 py-2.5 text-paper outline-none transition-colors placeholder:text-paper/30 focus:border-primary";

export function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mono mb-1.5 block text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
export const Text = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${inputCls} ${p.className ?? ""}`} />;
export const Area = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={`${inputCls} resize-y ${p.className ?? ""}`} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${inputCls} ${p.className ?? ""}`} />;

export function Btn({ kind = "ghost", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "gold" | "ghost" | "danger" }) {
  const k = { gold: "bg-primary text-ink hover:bg-paper", ghost: "border border-paper/30 hover:border-primary hover:text-primary", danger: "border border-secondary/60 text-secondary hover:bg-secondary hover:text-ink" }[kind];
  return <button type="button" {...p} className={`mono px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${k} ${className}`} />;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-paper/15 bg-ink-2 p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function Errors({ list }: { list: string[] }) {
  if (!list.length) return null;
  return <ul role="alert" className="mb-4 space-y-1 border border-secondary/60 bg-secondary/10 p-3 text-sm text-secondary">{list.map((e, i) => <li key={i}>• {e}</li>)}</ul>;
}

/** Miniatura de un fichero del repo (descarga el blob con el token). */
const cache = new Map<string, string>();
export function RemoteImg({ gh, sha, className = "" }: { gh: GitHub; sha: string; className?: string }) {
  const [url, setUrl] = useState<string | undefined>(cache.get(sha));
  useEffect(() => {
    if (cache.has(sha)) return;
    let alive = true;
    gh.blobUrl(sha).then((u) => { cache.set(sha, u); if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [gh, sha]);
  // eslint-disable-next-line @next/next/no-img-element -- blob local del panel
  return url ? <img src={url} alt="" className={`object-cover ${className}`} /> : <div className={`animate-pulse bg-paper/10 ${className}`} />;
}

/* ---------- Medios ---------- */
const blobToB64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = () => rej(r.error); r.readAsDataURL(b); });

/** Reduce una imagen (el repositorio y GitHub Pages lo agradecen) y la convierte a JPEG. */
export async function resizeImage(file: File, maxSide: number): Promise<{ base64: string; preview: string }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const ctx = c.getContext("2d")!; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar la imagen."))), "image/jpeg", 0.86));
  return { base64: await blobToB64(blob), preview: URL.createObjectURL(blob) };
}
export const MAX_VIDEO_MB = 40;
export async function readVideo(file: File): Promise<{ base64: string; preview: string }> {
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`«${file.name}» pesa más de ${MAX_VIDEO_MB} MB. Súbelo a YouTube y añade el enlace.`);
  return { base64: await blobToB64(file), preview: URL.createObjectURL(file) };
}
export const safeName = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "archivo";
