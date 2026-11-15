/**
 * Modelo del panel: carga el contenido del repo, lo expone como «borradores» editables y,
 * al publicar, calcula EXACTAMENTE qué ficheros cambian (solo los que difieren).
 * Funciones puras salvo load(): se prueban sin red.
 */
import type { GitHub, DirEntry, Op } from "./github";

export const POSICIONES = ["Portero", "Defensa", "Central", "Lateral", "Medio", "Pivote", "Interior", "Mediapunta", "Extremo", "Delantero"] as const;
export const CATEGORIAS = ["partidos", "entrenamientos", "celebraciones", "momentos"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

const IMG = /\.(jpe?g|png|webp|avif|gif)$/i;
const VID = /\.(mp4|webm|mov)$/i;
const uid = () => Math.random().toString(36).slice(2, 10);
export const newId = uid;
const clean = (s: string) => s.normalize("NFC").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* ================= Jugadores ================= */
export interface PlayerDraft {
  id: string; nombre: string; posicion: string; dorsal: string; apodo: string; edad: string; altura: string; pie: string; nacionalidad: string; bio: string; stats: string;
  photo?: DirEntry; newPhoto?: { base64: string; preview: string }; removePhoto?: boolean;
}
export const playerKey = (nombre: string, posicion: string) =>
  `${clean(nombre).split(" ").map((w) => w.replace(/[^\p{L}\p{N}-]/gu, "")).filter(Boolean).join("_")}_${posicion}`;
const parseKey = (key: string) => { const parts = key.split("_"); return { nombre: parts.slice(0, -1).join(" "), posicion: parts[parts.length - 1] }; };
const statsToText = (s?: Record<string, number>) => Object.entries(s ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n");
const textToStats = (t: string) => Object.fromEntries(t.split(/[\n,]+/).map((l) => l.split(":")).filter((p) => p.length === 2 && p[0].trim() && !isNaN(+p[1])).map((p) => [p[0].trim(), Math.max(0, Math.min(100, +p[1]))]));

interface PlayerJson { dorsal?: number; apodo?: string; edad?: number; altura?: string; pie?: string; nacionalidad?: string; bio?: string; stats?: Record<string, number> }

export function playersFrom(files: DirEntry[], json: Record<string, PlayerJson>): PlayerDraft[] {
  const out = new Map<string, PlayerDraft>();
  const mk = (key: string, photo?: DirEntry): PlayerDraft => {
    const x = json[key] ?? {}; const { nombre, posicion } = parseKey(key);
    return { id: uid(), nombre, posicion: POSICIONES.find((p) => p.toLowerCase() === posicion.toLowerCase()) ?? posicion, dorsal: x.dorsal?.toString() ?? "", apodo: x.apodo ?? "", edad: x.edad?.toString() ?? "", altura: x.altura ?? "", pie: x.pie ?? "", nacionalidad: x.nacionalidad ?? "", bio: x.bio ?? "", stats: statsToText(x.stats), photo };
  };
  for (const f of files.filter((f) => IMG.test(f.name))) { const key = f.name.replace(/\.[^.]+$/, ""); if (!out.has(key)) out.set(key, mk(key, f)); }
  for (const key of Object.keys(json)) if (!key.startsWith("_") && !out.has(key)) out.set(key, mk(key));
  return [...out.values()];
}

export function validatePlayers(list: PlayerDraft[]): string[] {
  const errs: string[] = []; const seen = new Set<string>();
  for (const p of list) {
    const label = p.nombre || "(sin nombre)";
    if (clean(p.nombre).split(" ").length < 1 || !clean(p.nombre)) errs.push(`Jugador sin nombre.`);
    if (!POSICIONES.includes(p.posicion as never)) errs.push(`${label}: elige una posición.`);
    if (p.dorsal && (!/^\d{1,2}$/.test(p.dorsal))) errs.push(`${label}: el dorsal debe ser un número de 0 a 99.`);
    if (p.edad && !/^\d{1,2}$/.test(p.edad)) errs.push(`${label}: la edad debe ser un número.`);
    const k = playerKey(p.nombre, p.posicion).toLowerCase(); if (seen.has(k)) errs.push(`${label}: ya existe otro jugador con el mismo nombre y posición.`); seen.add(k);
  }
  return errs;
}

export function playerOps(orig: PlayerDraft[], cur: PlayerDraft[], origJsonText: string | null): Op[] {
  const ops: Op[] = [];
  const json: Record<string, PlayerJson> = {};
  const finalPaths = new Set<string>();
  for (const p of cur) {
    const key = playerKey(p.nombre, p.posicion);
    const x: PlayerJson = {};
    if (p.dorsal) x.dorsal = +p.dorsal; if (clean(p.apodo)) x.apodo = clean(p.apodo); if (p.edad) x.edad = +p.edad;
    if (clean(p.altura)) x.altura = clean(p.altura); if (clean(p.pie)) x.pie = clean(p.pie); if (clean(p.nacionalidad)) x.nacionalidad = clean(p.nacionalidad);
    if (p.bio.trim()) x.bio = p.bio.trim(); const st = textToStats(p.stats); if (Object.keys(st).length) x.stats = st;
    json[key] = x;
    if (p.newPhoto) {
      const path = `public/jugadores/${key}.jpg`; finalPaths.add(path);
      ops.push({ path, base64: p.newPhoto.base64 });
      if (p.photo && p.photo.path !== path) ops.push({ path: p.photo.path, delete: true });
    } else if (p.photo && p.removePhoto) ops.push({ path: p.photo.path, delete: true });
    else if (p.photo) {
      const ext = p.photo.name.slice(p.photo.name.lastIndexOf("."));
      const path = `public/jugadores/${key}${ext}`;
      if (path !== p.photo.path) { ops.push({ path, moveFromSha: p.photo.sha }, { path: p.photo.path, delete: true }); finalPaths.add(path); }
    }
  }
  const keep = new Set(cur.map((c) => c.id));
  for (const o of orig) if (!keep.has(o.id) && o.photo) ops.push({ path: o.photo.path, delete: true });
  const text = JSON.stringify(json, null, 2) + "\n";
  if (changed(text, origJsonText, Object.keys(json).length === 0)) ops.push({ path: "content/jugadores.json", text });
  return ops;
}

/* ================= Partidos ================= */
export interface MatchDraft { id: string; fecha: string; rival: string; local: boolean; lugar: string; competicion: string; a: string; b: string; nota: string }
interface MatchJson { fecha: string; rival: string; local?: boolean; lugar?: string; competicion?: string; goles?: [number, number]; nota?: string }
export const matchesFrom = (rows: MatchJson[]): MatchDraft[] => rows.map((r) => ({ id: uid(), fecha: r.fecha.replace(" ", "T").slice(0, 16), rival: r.rival, local: r.local !== false, lugar: r.lugar ?? "", competicion: r.competicion ?? "", a: r.goles?.[0]?.toString() ?? "", b: r.goles?.[1]?.toString() ?? "", nota: r.nota ?? "" }));
export function validateMatches(list: MatchDraft[]): string[] {
  const errs: string[] = [];
  list.forEach((m, i) => {
    const l = m.rival || `partido ${i + 1}`;
    if (!clean(m.rival)) errs.push(`Partido ${i + 1}: falta el rival.`);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(m.fecha)) errs.push(`${l}: fecha y hora no válidas.`);
    if ((m.a === "") !== (m.b === "")) errs.push(`${l}: rellena los dos marcadores o ninguno.`);
    if ((m.a !== "" && !/^\d{1,2}$/.test(m.a)) || (m.b !== "" && !/^\d{1,2}$/.test(m.b))) errs.push(`${l}: el marcador debe ser un número.`);
  });
  return errs;
}
export function matchOps(cur: MatchDraft[], origText: string | null): Op[] {
  const rows: MatchJson[] = [...cur].sort((x, y) => x.fecha.localeCompare(y.fecha)).map((m) => ({
    fecha: m.fecha.replace("T", " "), rival: clean(m.rival), local: m.local, ...(clean(m.lugar) && { lugar: clean(m.lugar) }), ...(clean(m.competicion) && { competicion: clean(m.competicion) }),
    ...(m.a !== "" && { goles: [+m.a, +m.b] as [number, number] }), ...(clean(m.nota) && { nota: clean(m.nota) }),
  }));
  const text = JSON.stringify(rows, null, 2).replace(/\[\s+(\d+),\s+(\d+)\s+\]/g, "[$1, $2]") + "\n";
  return changed(text, origText, rows.length === 0) ? [{ path: "content/partidos.json", text }] : [];
}

/* ================= Galería ================= */
export interface GalleryDraft {
  id: string; kind: "file" | "youtube"; category: Categoria; titulo: string; descripcion: string;
  file?: DirEntry & { cat: Categoria }; newFile?: { name: string; base64: string; preview: string; video: boolean }; url?: string;
}
interface GalleryJson { descripciones?: Record<string, { titulo?: string; descripcion?: string }>; videos?: { url: string; titulo: string; categoria?: Categoria; descripcion?: string }[] }
export const ytId = (u: string) => /(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/.exec(u)?.[1];
export function galleryFrom(byCat: Record<string, DirEntry[]>, json: GalleryJson): GalleryDraft[] {
  const out: GalleryDraft[] = [];
  for (const cat of CATEGORIAS) for (const f of byCat[cat] ?? []) if (IMG.test(f.name) || VID.test(f.name)) { const d = json.descripciones?.[f.name]; out.push({ id: uid(), kind: "file", category: cat, titulo: d?.titulo ?? "", descripcion: d?.descripcion ?? "", file: { ...f, cat } }); }
  for (const v of json.videos ?? []) out.push({ id: uid(), kind: "youtube", category: v.categoria ?? "momentos", titulo: v.titulo, descripcion: v.descripcion ?? "", url: v.url });
  return out;
}
export const isVideoName = (n: string) => VID.test(n);
export function validateGallery(list: GalleryDraft[]): string[] {
  const errs: string[] = [];
  for (const g of list) if (g.kind === "youtube") { if (!ytId(g.url ?? "")) errs.push(`«${g.titulo || g.url}»: enlace de YouTube no válido.`); if (!clean(g.titulo)) errs.push(`Un vídeo de YouTube necesita título.`); }
  return errs;
}
export function galleryOps(orig: GalleryDraft[], cur: GalleryDraft[], origJsonText: string | null): Op[] {
  const ops: Op[] = []; const desc: NonNullable<GalleryJson["descripciones"]> = {}; const videos: NonNullable<GalleryJson["videos"]> = [];
  const taken = new Set<string>(); const slot = (cat: string, name: string) => { let n = name, i = 2; while (taken.has(`${cat}/${n}`)) n = name.replace(/(\.[^.]+)$/, `-${i++}$1`); taken.add(`${cat}/${n}`); return n; };
  for (const g of cur) if (g.file && !g.newFile) taken.add(`${g.category}/${g.file.name}`);
  for (const g of cur) {
    const d = { ...(clean(g.titulo) && { titulo: clean(g.titulo) }), ...(clean(g.descripcion) && { descripcion: clean(g.descripcion) }) };
    if (g.kind === "youtube") { videos.push({ url: g.url!.trim(), titulo: clean(g.titulo), ...(g.category !== "momentos" && { categoria: g.category }), ...(clean(g.descripcion) && { descripcion: clean(g.descripcion) }) }); continue; }
    if (g.newFile) { const name = slot(g.category, g.newFile.name); ops.push({ path: `public/galeria/${g.category}/${name}`, base64: g.newFile.base64 }); if (Object.keys(d).length) desc[name] = d; continue; }
    const f = g.file!; if (Object.keys(d).length) desc[f.name] = d;
    if (f.cat !== g.category) ops.push({ path: `public/galeria/${g.category}/${f.name}`, moveFromSha: f.sha }, { path: f.path, delete: true });
  }
  const keep = new Set(cur.map((c) => c.id));
  for (const o of orig) if (!keep.has(o.id) && o.file) ops.push({ path: o.file.path, delete: true });
  const text = JSON.stringify({ descripciones: desc, videos }, null, 2) + "\n";
  if (changed(text, origJsonText, Object.keys(desc).length === 0 && videos.length === 0)) ops.push({ path: "content/galeria.json", text });
  return ops;
}

/* ================= Club y ajustes ================= */
export interface ClubJson { manifesto: string; values: { word: string; text: string }[]; quote: { text: string; by: string }; [k: string]: unknown }
export interface Ajustes { whatsapp: { number: string; display: string }; socials: { id: string; label: string; handle: string; url: string }[] }
export const SOCIAL_IDS = ["instagram", "tiktok", "youtube", "facebook", "x"] as const;
export const displayPhone = (n: string) => (/^34\d{9}$/.test(n) ? `${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)} ${n.slice(9)}` : `+${n}`);

export function validateAjustes(a: Ajustes): string[] {
  const e: string[] = [];
  if (!/^\d{9,15}$/.test(a.whatsapp.number)) e.push("WhatsApp: solo dígitos con prefijo de país, sin + ni espacios (p. ej. 34644250482).");
  for (const s of a.socials) if (!/^https:\/\//.test(s.url) || !clean(s.label)) e.push(`Red social «${s.label || s.id}»: necesita nombre y una URL que empiece por https://.`);
  return e;
}
export const jsonOp = (path: string, value: unknown, origText: string | null): Op[] => {
  const text = JSON.stringify(value, null, 2) + "\n";
  return changed(text, origText, false) ? [{ path, text }] : [];
};

/* ================= util ================= */
/** ¿Hay que escribir `text`? Si el fichero no existía solo si tiene contenido; si existía, solo si el JSON difiere. */
const changed = (text: string, orig: string | null, isEmpty: boolean) => (orig === null ? !isEmpty : !sameJson(text, orig));
function sameJson(a: string, b: string) { try { return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b)); } catch { return false; } }

/* ================= carga ================= */
export interface Loaded {
  players: PlayerDraft[]; playersText: string | null;
  matches: MatchDraft[]; matchesText: string | null;
  gallery: GalleryDraft[]; galleryText: string | null;
  club: ClubJson; clubText: string | null;
  ajustes: Ajustes; ajustesText: string | null;
}
const parse = <T,>(t: string | null, d: T): T => { try { return t ? (JSON.parse(t) as T) : d; } catch { throw new Error("Un fichero de /content tiene JSON inválido; arréglalo en GitHub antes de usar el panel."); } };

export async function load(gh: GitHub): Promise<Loaded> {
  const [pj, mj, gj, cj, aj, pf, ...gf] = await Promise.all([
    gh.readText("content/jugadores.json"), gh.readText("content/partidos.json"), gh.readText("content/galeria.json"), gh.readText("content/club.json"), gh.readText("content/ajustes.json"),
    gh.list("public/jugadores"), ...CATEGORIAS.map((c) => gh.list(`public/galeria/${c}`)),
  ]);
  const byCat = Object.fromEntries(CATEGORIAS.map((c, i) => [c, gf[i]]));
  return {
    players: playersFrom(pf, parse(pj, {})), playersText: pj,
    matches: matchesFrom(parse(mj, [])), matchesText: mj,
    gallery: galleryFrom(byCat, parse(gj, {})), galleryText: gj,
    club: { manifesto: "", values: [], quote: { text: "", by: "" }, ...parse<Partial<ClubJson>>(cj, {}) } as ClubJson, clubText: cj,
    ajustes: parse<Ajustes>(aj, { whatsapp: { number: "", display: "" }, socials: [] }), ajustesText: aj,
  };
}
