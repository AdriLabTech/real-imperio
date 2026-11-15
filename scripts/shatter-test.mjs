// Prueba del efecto de descomposición al pasar el ratón. Uso: node scripts/shatter-test.mjs <url> [carpeta-capturas]
import { chromium } from "@playwright/test";
const [url, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/chromium" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: "networkidle" });
await p.evaluate(() => sessionStorage.setItem("intro", "1")); await p.reload({ waitUntil: "networkidle" });
await p.locator("#plantilla ul.overflow-x-auto").scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
const card = p.locator("#plantilla ul.overflow-x-auto li button").nth(1);
const bx = await card.boundingBox();
let bad = 0; const check = (c, m) => { console.log((c ? "✓ " : "✗ ") + m); if (!c) bad = 1; };
const state = () => card.evaluate((btn) => { const ov = btn.querySelector("[data-shatter]"); const tiles = ov ? [...ov.querySelector("[data-shatter-tiles]").children] : []; const moved = tiles.filter((t) => t.style.transform).length; const img = btn.querySelector("img"); return { overlay: !!ov, tiles: tiles.length, moved, imgHidden: img?.style.visibility === "hidden" }; });
const s0 = await state(); check(!s0.overlay, "en reposo no hay overlay (coste cero)");
await p.mouse.move(bx.x + bx.width * 0.15, bx.y + bx.height * 0.2);
await p.mouse.move(bx.x + bx.width * 0.5, bx.y + bx.height * 0.4, { steps: 8 }); await p.waitForTimeout(500);
const s1 = await state(); check(s1.overlay && s1.tiles > 40, `hover: ${s1.tiles} piezas creadas`);
check(s1.moved > 10 && s1.moved < s1.tiles, `piezas cercanas al cursor desplazadas (${s1.moved}/${s1.tiles}); las lejanas quietas`);
check(s1.imgHidden, "la imagen original se oculta mientras hay piezas");
if (out) await card.screenshot({ path: out + "/shatter-hover.png" });
await p.mouse.move(bx.x + bx.width * 0.8, bx.y + bx.height * 0.7, { steps: 6 }); await p.waitForTimeout(300);
if (out) await card.screenshot({ path: out + "/shatter-move.png" });
await p.mouse.move(10, 10, { steps: 5 }); await p.waitForTimeout(350);
const mid = await state(); check(mid.overlay, "al salir, las piezas siguen recomponiéndose");
await p.waitForTimeout(2500);
const s2 = await state(); check(!s2.overlay && !s2.imgHidden, "recompuesta: overlay eliminado y foto original visible");
// clic tras hover sigue abriendo la ficha
await p.mouse.move(bx.x + 100, bx.y + 100, { steps: 4 }); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(700);
check((await p.locator("div[role=dialog]").count()) === 1, "clic sobre la tarjeta sigue abriendo la ficha");
await b.close(); process.exit(bad);
