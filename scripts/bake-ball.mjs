// Precalcula las texturas del balón (color + relieve) y las guarda en public/textures.
// Uso: node scripts/bake-ball.mjs   (requiere el servidor de desarrollo o producción en marcha: BASE=http://localhost:3200)
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("../src/lib/ball-texture-core.js", import.meta.url), "utf8");
const b = await chromium.launch({ executablePath: "/usr/bin/chromium" });
const p = await b.newPage();
await p.setContent("<canvas></canvas>");
const out = await p.evaluate(async (code) => {
  const fn = new Function(code + "; return bake(1024, 512);");
  return fn();
}, src);
for (const [name, dataUrl] of Object.entries(out)) writeFileSync(new URL(`../public/textures/${name}.webp`, import.meta.url), Buffer.from(dataUrl.split(",")[1], "base64"));
await b.close();
console.log("texturas escritas en public/textures");
