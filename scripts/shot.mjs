// Uso: node scripts/shot.mjs <url> <salida.png> [ancho] [alto] [scrollY] [esperaMs] [selector]
import { chromium } from "@playwright/test";
const [url, out, w = "1440", h = "900", y = "0", wait = "4500", sel] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
p.on("console", (m) => ["error", "warning"].includes(m.type()) && errs.push(`${m.type()}: ${m.text()}`));
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(+wait);
if (sel) { await p.evaluate((q) => { const e = document.querySelector(q); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 20); }, sel); await p.waitForTimeout(2200); }
else if (+y) { await p.evaluate((v) => window.scrollTo(0, v), +y); await p.waitForTimeout(1800); }
await p.screenshot({ path: out });
if (errs.length) console.log(errs.slice(0, 8).join("\n"));
await b.close();
