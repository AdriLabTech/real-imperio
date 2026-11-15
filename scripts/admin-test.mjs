// E2E del panel con una API de GitHub SIMULADA (no toca ningún repositorio real).
// Uso: node scripts/admin-test.mjs <url-del-sitio> <foto.jpg> <carpeta-salida>
// Requiere que public/admin-vault.json esté sellado con la contraseña de PRUEBA (clave-de-prueba-larga-0123456789).
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [site, photo, outDir] = process.argv.slice(2);
const PW = "clave-de-prueba-larga-0123456789";
let bad = 0; const check = (c, m) => { console.log((c ? "✓ " : "✗ ") + m); if (!c) bad = 1; };

/* ---- repo falso en memoria ---- */
const sha = (b) => crypto.createHash("sha1").update(b).digest("hex");
const files = new Map(); const blobs = new Map();
const put = (p, b) => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b); const s = sha(buf); blobs.set(s, buf); files.set(p, s); };
put("content/jugadores.json", JSON.stringify({ Juan_Perez_Delantero: { dorsal: 9, bio: "Existente" } }, null, 2) + "\n");
put("content/partidos.json", JSON.stringify([{ fecha: "2026-12-05 18:30", rival: "Rival Previo", local: true }], null, 2) + "\n");
put("content/galeria.json", '{ "descripciones": {}, "videos": [] }\n');
put("content/club.json", fs.readFileSync("content/club.json"));
put("content/ajustes.json", fs.readFileSync("content/ajustes.json"));
put("public/jugadores/Juan_Perez_Delantero.jpg", fs.readFileSync(photo));
let commits = 0, lastAuth = ""; const treeStaging = new Map();

const entries = (dir) => [...files].filter(([p]) => p.startsWith(dir + "/") && !p.slice(dir.length + 1).includes("/")).map(([p, s]) => ({ type: "file", name: p.split("/").pop(), path: p, sha: s, size: blobs.get(s).length }));

const b = await chromium.launch({ executablePath: "/usr/bin/chromium" });
const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
const p = await ctx.newPage();
p.on("dialog", (d) => d.accept());
await p.route("https://api.github.com/**", async (route) => {
  const req = route.request(); const u = new URL(req.url()); const rel = u.pathname.replace("/repos/demo/prueba", ""); const h = req.headers();
  lastAuth = h.authorization ?? ""; const json = (o, s = 200) => route.fulfill({ status: s, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(o) });
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
  if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
  if (rel === "/branches/main") return json({ name: "main" });
  if (rel.startsWith("/contents/")) {
    const fp = decodeURIComponent(rel.slice(10));
    if (files.has(fp)) return route.fulfill({ status: 200, headers: cors, body: blobs.get(files.get(fp)) });
    const list = entries(fp); return list.length ? json(list) : route.fulfill({ status: 404, headers: cors, contentType: "application/json", body: '{"message":"Not Found"}' });
  }
  if (rel.startsWith("/git/blobs/") && req.method() === "GET") return route.fulfill({ status: 200, headers: cors, body: blobs.get(rel.split("/").pop()) });
  if (rel === "/git/ref/heads/main") return json({ object: { sha: "c" + commits } });
  if (rel.startsWith("/git/commits/") && req.method() === "GET") return json({ tree: { sha: "t" + commits } });
  if (rel === "/git/blobs") { const j = req.postDataJSON(); const buf = j.encoding === "base64" ? Buffer.from(j.content, "base64") : Buffer.from(j.content); const s = sha(buf); blobs.set(s, buf); return json({ sha: s }, 201); }
  if (rel === "/git/trees") { const j = req.postDataJSON(); treeStaging.set("t", j.tree); return json({ sha: "tnew" }, 201); }
  if (rel === "/git/commits") { return json({ sha: "cnew" }, 201); }
  if (rel === "/git/refs/heads/main") { for (const e of treeStaging.get("t")) { if (e.sha === null) files.delete(e.path); else files.set(e.path, e.sha); } commits++; return json({ ok: true }); }
  return route.fulfill({ status: 500, headers: cors, body: "ruta no simulada: " + rel });
});

await p.goto(site.replace(/\/$/, "") + "/admin/", { waitUntil: "networkidle" });
check(await p.locator("text=Administración").count() > 0, "/admin/ muestra el acceso");
await p.fill('input[type=password]', "contraseña-incorrecta-xxxxxxxx"); await p.click("button[type=submit]");
await p.waitForSelector("p[role=alert]"); check((await p.locator("p[role=alert]").innerText()).includes("incorrecta"), "contraseña incorrecta rechazada");
check(lastAuth === "", "con contraseña incorrecta NO se hizo ninguna llamada a GitHub");
await p.fill('input[type=password]', PW); await p.click("button[type=submit]");
await p.waitForSelector("text=Sin cambios", { timeout: 20000 });
check(lastAuth === "Bearer github_pat_FAKE000", "contraseña correcta: usa el token descifrado");
check(await p.locator("text=Juan Perez").count() > 0, "carga el jugador existente del repositorio");

// jugadores
await p.click("text=+ Añadir jugador");
await p.fill('input[placeholder="Juan Pérez García"]', "Pedro Gómez Ruiz");
await p.selectOption("select >> nth=0", "Portero");
await p.locator('label:has-text("Dorsal") input').fill("1");
await p.locator('label:has-text("Breve descripción") textarea').fill("Reflejos de gato.");
await p.locator('label:has-text("Subir foto") input[type=file]').setInputFiles(photo);
await p.waitForSelector("text=1 archivo", { timeout: 1000 }).catch(() => {});
// partidos
await p.click("button:has-text('Partidos')"); await p.click("text=+ Añadir partido");
// lista ordenada por fecha descendente: el existente (dic) primero, el nuevo (+7 días) segundo
await p.locator('label:has-text("Rival *") input').nth(1).fill("Nuevo Rival");
await p.locator('label:has-text("Goles nuestros") input').nth(1).fill("2"); await p.locator('label:has-text("Goles rival") input').nth(1).fill("1");
// galería
await p.click("button:has-text('Galería')");
await p.locator('input[type=file][multiple]').setInputFiles(photo);
await p.waitForSelector("text=NUEVO", { timeout: 15000 });
await p.fill('input[placeholder="https://youtu.be/…"]', "https://youtu.be/dQw4w9WgXcQ");
await p.locator('label:has-text("Título") input').fill("Resumen del derbi");
await p.click("text=Añadir vídeo de YouTube");
// web
await p.click("button:has-text('Web y contacto')");
await p.locator('label:has-text("Cita destacada") input').fill("Frase nueva del panel");
await p.waitForTimeout(300);
await p.click("button:has-text('Jugadores')"); await p.locator("ul > li button[aria-expanded]").first().click(); await p.waitForTimeout(400); await p.screenshot({ path: path.join(outDir, "admin-jugadores.png") }); await p.click("button:has-text('Web y contacto')");
const pending = await p.locator("text=/archivos? con cambios/").innerText(); console.log("  " + pending);
check(/^\d+ archivos/i.test(pending), "el contador refleja los archivos modificados");

const before = commits;
await p.click("button:has-text('Publicar cambios')");
await p.waitForSelector("text=Publicado", { timeout: 30000 });
check(commits === before + 1, "todo se publica en UN solo commit");

const txt = (f) => blobs.get(files.get(f))?.toString();
const pj = JSON.parse(txt("content/jugadores.json"));
check(pj.Pedro_Gómez_Ruiz_Portero?.dorsal === 1 && pj.Pedro_Gómez_Ruiz_Portero.bio === "Reflejos de gato.", "jugadores.json: jugador nuevo con dorsal y descripción");
check(pj.Juan_Perez_Delantero?.dorsal === 9, "el jugador existente no se ha tocado");
const ph = blobs.get(files.get("public/jugadores/Pedro_Gómez_Ruiz_Portero.jpg"));
check(ph && ph[0] === 0xff && ph[1] === 0xd8, "foto del jugador subida como JPEG con el nombre Nombre_Apellidos_Posicion");
check(ph.length < fs.statSync(photo).size, `la foto se redujo (${fs.statSync(photo).size} → ${ph.length} bytes)`);
const pm = JSON.parse(txt("content/partidos.json"));
check(pm.length === 2 && pm.some((m) => m.rival === "Nuevo Rival" && m.goles?.join() === "2,1"), "partidos.json: partido nuevo con resultado");
const gj = JSON.parse(txt("content/galeria.json"));
check(gj.videos?.[0]?.titulo === "Resumen del derbi", "galeria.json: vídeo de YouTube");
check([...files.keys()].some((k) => /^public\/galeria\/partidos\/.+\.jpg$/.test(k)), "foto de galería subida a su categoría");
check(JSON.parse(txt("content/club.json")).quote.text === "Frase nueva del panel", "club.json: cita actualizada");
check(!files.has("public/jugadores/Pedro_Gomez_Ruiz_Portero.jpg"), "sin archivos huérfanos");
await p.waitForSelector("text=Sin cambios"); check(true, "tras publicar el panel recarga el estado (sin cambios pendientes)");

// el sitio real debe poder LEER lo que ha escrito el panel
const dump = path.join(outDir, "repo-dump"); fs.rmSync(dump, { recursive: true, force: true });
for (const [f, s] of files) { fs.mkdirSync(path.dirname(path.join(dump, f)), { recursive: true }); fs.writeFileSync(path.join(dump, f), blobs.get(s)); }
const { execFileSync } = await import("node:child_process");
const proj = process.cwd();
const out = execFileSync("node", ["-e", `import('${proj}/src/lib/content.ts').then(m=>{const c=m.loadContent();console.log(JSON.stringify({players:c.players.map(p=>[p.name,p.position,p.number,!!p.photo]),matches:c.matches.length,gallery:c.gallery.map(g=>g.type)}))})`], { cwd: dump }).toString().trim();
console.log("  loader →", out);
const lc = JSON.parse(out);
check(lc.players.length === 2 && lc.players.some((x) => x[0] === "Pedro Gómez Ruiz" && x[1] === "POR" && x[2] === 1 && x[3]), "el cargador de la web lee el jugador creado por el panel");
check(lc.matches === 2 && lc.gallery.includes("youtube") && lc.gallery.includes("photo"), "el cargador lee partidos y galería escritos por el panel");

// cerrar sesión
await p.click("button:has-text('Salir')"); await p.waitForSelector('input[type=password]'); check(true, "«Salir» vuelve a bloquear el panel");
await b.close(); process.exit(bad);
