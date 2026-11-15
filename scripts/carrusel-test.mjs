// Prueba del carrusel de la plantilla con ratón. Uso: node scripts/carrusel-test.mjs <url>
import { chromium } from "@playwright/test";
const b = await chromium.launch({ executablePath: "/usr/bin/chromium" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(process.argv[2], { waitUntil: "networkidle" });
await p.evaluate(() => sessionStorage.setItem("intro", "1")); await p.reload({ waitUntil: "networkidle" });
await p.evaluate(() => { window.__dragstart = 0; addEventListener("dragstart", () => window.__dragstart++, true); });
const ul = p.locator("#plantilla ul.overflow-x-auto");
await ul.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
const box = await p.locator("#plantilla ul.overflow-x-auto li button").first().boundingBox();
let bad = 0; const check = (c, m) => { console.log((c ? "✓ " : "✗ ") + m); if (!c) bad = 1; };
const x0 = box.x + box.width / 2, y0 = box.y + box.height / 2; // justo sobre la foto
for (let t = 1; t <= 3; t++) {
  const before = await ul.evaluate((e) => e.scrollLeft);
  await p.mouse.move(x0 + 300, y0); await p.mouse.down();
  for (let i = 1; i <= 20; i++) await p.mouse.move(x0 + 300 - i * 12, y0 + (i % 3));
  await p.mouse.up(); await p.waitForTimeout(150);
  const after = await ul.evaluate((e) => e.scrollLeft);
  check(after - before > 150, `arrastre ${t} sobre la foto: scrollLeft ${Math.round(before)} → ${Math.round(after)}`);
}
check((await p.evaluate(() => window.__dragstart)) === 0, "el navegador no inició ningún arrastre de imagen (dragstart = 0)");
check(!(await p.locator("div[role=dialog]").count()), "arrastrar no abre la ficha por error");
const b4 = await ul.evaluate((e) => e.scrollLeft);
await p.click('button[aria-label="Jugadores siguientes"]'); await p.waitForTimeout(900);
check((await ul.evaluate((e) => e.scrollLeft)) > b4 + 200, "flecha «siguientes» desplaza");
await p.click('button[aria-label="Jugadores anteriores"]'); await p.waitForTimeout(900);
check((await ul.evaluate((e) => e.scrollLeft)) < b4 + 100, "flecha «anteriores» retrocede");
await p.locator("#plantilla ul.overflow-x-auto li button").first().click(); await p.waitForTimeout(800);
check((await p.locator("div[role=dialog]").count()) === 1, "un clic normal sí abre la ficha");
await b.close(); process.exit(bad);
