/**
 * Cargador de contenido (solo se ejecuta al compilar, en el servidor de Next).
 *  - content/jugadores.json  → datos extra de jugadores (opcional) o jugadores sin foto
 *  - public/jugadores/*      → fotos con el nombre Nombre_Apellidos_Posicion.jpg (detectadas solas)
 *  - content/partidos.json   → calendario y resultados
 *  - public/galeria/<cat>/*  → fotos y vídeos (detectados solos) + content/galeria.json (textos y enlaces de YouTube)
 *  - content/club.json       → textos de «El club»
 * Los errores de formato se explican en castellano y detienen la compilación.
 */
import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import type { Category, ClubContent, Content, GalleryItem, Match, Player, Position } from "./types";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, process.env.CONTENT_DIR ?? "content");
const PUBLIC = path.join(ROOT, "public");
/** En modo demo las fotos viven en public/demo/ (ignorado por git y fuera de la web real). */
const DEMO = path.basename(CONTENT) === "content-demo";
const PLAYERS_DIR = DEMO ? "demo/jugadores" : "jugadores";
const IMG = /\.(jpe?g|png|webp|avif|gif)$/i;
const VID = /\.(mp4|webm|mov)$/i;

class ContentError extends Error {
  constructor(msg: string) {
    super(`\n\n  ✗ CONTENIDO: ${msg}\n`);
  }
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function readJson<T>(file: string, fallback: T): T {
  const p = path.join(CONTENT, file);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch (e) {
    throw new ContentError(`content/${file} no es un JSON válido (${(e as Error).message}). Revisa comas y comillas.`);
  }
}

function listFiles(dir: string, re: RegExp): string[] {
  const d = path.join(PUBLIC, dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => re.test(f)).sort((a, b) => a.localeCompare(b, "es"));
}

/* ---------- Jugadores ---------- */
const POSITIONS: Record<string, Position> = {
  portero: "POR", porteros: "POR", guardameta: "POR",
  defensa: "DEF", defensas: "DEF", central: "DEF", lateral: "DEF", carrilero: "DEF",
  medio: "MED", mediocentro: "MED", centrocampista: "MED", pivote: "MED", mediapunta: "MED", interior: "MED",
  delantero: "DEL", extremo: "DEL", punta: "DEL", ariete: "DEL",
};
const POS_ORDER: Position[] = ["POR", "DEF", "MED", "DEL"];

/** «Juan_Perez_Garcia_Delantero» → nombre «Juan Perez Garcia», posición «Delantero». */
export function parsePlayerKey(key: string): { name: string; positionLabel: string; position: Position } {
  const parts = key.split("_").filter(Boolean);
  const pos = parts.length > 1 ? parts[parts.length - 1] : "";
  const position = POSITIONS[norm(pos)];
  if (parts.length < 2 || !position)
    throw new ContentError(
      `«${key}» no sigue la nomenclatura Nombre_Apellidos_Posicion.\n  La posición (última palabra) debe ser una de: ${[...new Set(Object.keys(POSITIONS))].join(", ")}.`,
    );
  const label = pos.charAt(0).toUpperCase() + pos.slice(1).toLowerCase();
  return { name: parts.slice(0, -1).join(" "), positionLabel: label, position };
}

interface PlayerExtra {
  dorsal?: number; apodo?: string; edad?: number; altura?: string; pie?: string; nacionalidad?: string; bio?: string;
  stats?: Record<string, number>;
}

function loadPlayers(): Player[] {
  const extras = readJson<Record<string, PlayerExtra>>("jugadores.json", {});
  const byId = new Map<string, Player>();
  const slug = (k: string) => norm(k).replace(/[^a-z0-9_]/g, "");

  for (const file of listFiles(PLAYERS_DIR, IMG)) {
    const key = file.replace(/\.[^.]+$/, "");
    const id = slug(key);
    if (byId.has(id)) continue;
    byId.set(id, { id, ...parsePlayerKey(key), photo: `/${PLAYERS_DIR}/${file}` });
  }
  const extraKeys = new Map(Object.keys(extras).filter((k) => !k.startsWith("_")).map((k) => [slug(k), k]));
  for (const [id, key] of extraKeys) if (!byId.has(id)) byId.set(id, { id, ...parsePlayerKey(key) });

  for (const [id, p] of byId) {
    const x = extras[extraKeys.get(id) ?? ""];
    if (!x) continue;
    if (x.dorsal !== undefined && (!Number.isInteger(x.dorsal) || x.dorsal < 0 || x.dorsal > 99))
      throw new ContentError(`dorsal de «${id}» debe ser un número entre 0 y 99.`);
    p.number = x.dorsal; p.nickname = x.apodo; p.age = x.edad; p.height = x.altura; p.foot = x.pie; p.nationality = x.nacionalidad; p.bio = x.bio;
    if (x.stats) p.stats = Object.entries(x.stats).map(([label, value]) => ({ label, value: Math.max(0, Math.min(100, Number(value) || 0)) }));
  }
  return [...byId.values()].sort(
    (a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || (a.number ?? 99) - (b.number ?? 99) || a.name.localeCompare(b.name, "es"),
  );
}

/* ---------- Partidos ---------- */
/** «2026-12-05 18:30» (hora de Madrid) → instante ISO, con horario de verano correcto. */
export function madridToISO(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(s.trim());
  if (!m) throw new ContentError(`fecha «${s}» no válida. Formato: "2026-12-05 18:30" (hora de Madrid).`);
  const [y, mo, d, h = "12", mi = "00"] = m.slice(1);
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  const wall = (ts: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(ts).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  };
  let t = guess - (wall(guess) - guess);
  t = guess - (wall(t) - t);
  return new Date(t).toISOString();
}

interface MatchRow { fecha: string; rival: string; local?: boolean; lugar?: string; competicion?: string; goles?: [number, number]; nota?: string }

function loadMatches(): Match[] {
  const rows = readJson<MatchRow[]>("partidos.json", []);
  if (!Array.isArray(rows)) throw new ContentError("content/partidos.json debe ser una lista [ { ... }, { ... } ].");
  return rows
    .map((r, i): Match => {
      const where = `partido nº ${i + 1} de content/partidos.json`;
      if (!r.fecha || !r.rival) throw new ContentError(`${where}: faltan "fecha" y/o "rival".`);
      if (r.goles && (!Array.isArray(r.goles) || r.goles.length !== 2 || r.goles.some((g) => !Number.isInteger(g) || g < 0)))
        throw new ContentError(`${where}: "goles" debe ser [nuestros, rival], p. ej. [3, 1].`);
      return {
        id: `m${i}`, opponent: String(r.rival), date: madridToISO(r.fecha), home: r.local !== false, venue: r.lugar, competition: r.competicion,
        score: r.goles ? { us: r.goles[0], them: r.goles[1] } : undefined, note: r.nota,
      };
    })
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

/* ---------- Galería ---------- */
const CATS: Category[] = ["partidos", "entrenamientos", "celebraciones", "momentos"];
interface GalleryJson {
  descripciones?: Record<string, { titulo?: string; descripcion?: string }>;
  videos?: { url: string; titulo: string; categoria?: Category; descripcion?: string }[];
}

const youtubeId = (url: string) => /(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/.exec(url)?.[1];
const prettify = (f: string) => { const t = f.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(); return t.charAt(0).toUpperCase() + t.slice(1); };

function loadGallery(): GalleryItem[] {
  const meta = readJson<GalleryJson>("galeria.json", {});
  const items: GalleryItem[] = [];
  for (const cat of [...CATS, "" as const]) {
    const rel = cat ? `galeria/${cat}` : "galeria";
    for (const file of listFiles(rel, new RegExp(`${IMG.source}|${VID.source}`, "i"))) {
      const isVideo = VID.test(file);
      let ratio = 16 / 9;
      if (!isVideo) {
        try {
          const dim = imageSize(fs.readFileSync(path.join(PUBLIC, rel, file)));
          if (dim.width && dim.height) ratio = dim.width / dim.height;
        } catch { /* imagen ilegible: se usa 4:3 */ ratio = 4 / 3; }
      }
      const d = meta.descripciones?.[file];
      items.push({
        id: `${rel}/${file}`, type: isVideo ? "video" : "photo", category: cat || "momentos", title: d?.titulo ?? prettify(file),
        caption: d?.descripcion, src: `/${rel}/${file}`, ratio: Math.min(2.2, Math.max(0.5, ratio)),
      });
    }
  }
  for (const v of meta.videos ?? []) {
    const id = youtubeId(v.url);
    if (!id) throw new ContentError(`content/galeria.json: «${v.url}» no parece un enlace de YouTube.`);
    if (v.categoria && !CATS.includes(v.categoria)) throw new ContentError(`content/galeria.json: categoría «${v.categoria}» no válida (${CATS.join(", ")}).`);
    items.push({ id: `yt-${id}`, type: "youtube", category: v.categoria ?? "momentos", title: v.titulo, caption: v.descripcion, youtubeId: id, ratio: 16 / 9 });
  }
  return items;
}

/* ---------- Club ---------- */
const CLUB_DEFAULT: ClubContent = {
  manifesto: "Edita este texto en content/club.json.",
  values: [], quote: { text: "", by: "" },
};

export function loadContent(): Content {
  const club = { ...CLUB_DEFAULT, ...readJson<Partial<ClubContent>>("club.json", {}) };
  return { players: loadPlayers(), matches: loadMatches(), gallery: loadGallery(), club, builtAt: Date.now() };
}
