#!/usr/bin/env node
// Atajos para actualizar la web en segundos. Edita los JSON de /content por ti.
//   npm run nuevo -- partido  "Rival" "2026-12-05 18:30" [--fuera] [--lugar "Campo X"] [--comp "Liga"]
//   npm run nuevo -- resultado "Rival" 3 1                 (marca el marcador del partido con ese rival)
//   npm run nuevo -- jugador  "Juan Perez Delantero" [--dorsal 9] [--apodo "El 9"]   (sin foto)
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "content");
const [cmd, ...rest] = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith("--")) { const k = rest[i].slice(2); const v = rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[++i] : true; flags[k] = v; } else pos.push(rest[i]);
}
const read = (f, d) => (fs.existsSync(path.join(dir, f)) ? JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) : d);
const write = (f, v) => fs.writeFileSync(path.join(dir, f), JSON.stringify(v, null, 2).replace(/\[\s+(\d+),\s+(\d+)\s+\]/g, "[$1, $2]") + "\n");
const die = (m) => { console.error("✗ " + m); process.exit(1); };
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

if (cmd === "partido") {
  const [rival, fecha] = pos;
  if (!rival || !fecha) die('Uso: npm run nuevo -- partido "Rival" "2026-12-05 18:30" [--fuera] [--lugar "..."] [--comp "..."]');
  if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(fecha)) die('Fecha no válida. Formato: "2026-12-05 18:30"');
  const rows = read("partidos.json", []);
  rows.push({ fecha, rival, local: !flags.fuera, ...(flags.lugar && { lugar: flags.lugar }), ...(flags.comp && { competicion: flags.comp }) });
  rows.sort((a, b) => a.fecha.localeCompare(b.fecha));
  write("partidos.json", rows);
  console.log(`✓ Partido añadido: ${flags.fuera ? "" : "Real Imperio vs "}${rival}, ${fecha}`);
} else if (cmd === "resultado") {
  const [rival, a, b] = pos;
  if (!rival || a === undefined || b === undefined || isNaN(+a) || isNaN(+b)) die('Uso: npm run nuevo -- resultado "Rival" 3 1   (nuestros goles, goles del rival)');
  const rows = read("partidos.json", []);
  const cand = rows.filter((r) => norm(r.rival).includes(norm(rival)) && !r.goles);
  if (cand.length === 0) die(`No hay ningún partido sin resultado contra «${rival}».`);
  if (cand.length > 1) die(`Hay ${cand.length} partidos sin resultado contra «${rival}». Edita content/partidos.json a mano.`);
  cand[0].goles = [+a, +b];
  write("partidos.json", rows);
  console.log(`✓ Resultado guardado: ${cand[0].rival} ${a}-${b}`);
} else if (cmd === "jugador") {
  const words = (pos[0] ?? "").trim().split(/\s+/);
  if (words.length < 2) die('Uso: npm run nuevo -- jugador "Juan Perez Delantero" [--dorsal 9] [--apodo "El 9"]');
  const key = words.join("_");
  const rows = read("jugadores.json", {});
  if (rows[key]) die(`«${key}» ya existe.`);
  rows[key] = { ...(flags.dorsal && { dorsal: +flags.dorsal }), ...(flags.apodo && { apodo: flags.apodo }) };
  write("jugadores.json", rows);
  console.log(`✓ Jugador añadido: ${key}\n  Para su foto, guárdala como public/jugadores/${key}.jpg`);
} else {
  console.log(`Comandos:
  partido   "Rival" "2026-12-05 18:30" [--fuera] [--lugar "..."] [--comp "..."]
  resultado "Rival" <nuestros> <rival>
  jugador   "Nombre Apellidos Posicion" [--dorsal N] [--apodo "..."]
Las fotos de jugadores (public/jugadores) y la galería (public/galeria/<categoria>) se detectan solas.`);
}
