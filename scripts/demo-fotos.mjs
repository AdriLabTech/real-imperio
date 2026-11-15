// Descarga fotos de PRUEBA (retratos de stock de pravatar.cc) para el modo demo.
// Se guardan en public/demo/jugadores (ignorado por git: no se sube ni se publica).
// Uso: npm run demo:fotos
import fs from "node:fs";

const PLAYERS = {
  "Carlos_Mendoza_Ruiz_Portero": 18,
  "Javier_Ortega_Lara_Lateral": 8,
  "Diego_Salcedo_Vega_Central": 3,
  "Marcos_Villalba_Pinto_Pivote": 13,
  "Raul_Navarro_Gil_Interior": 14,
  "Andres_Quiroga_Bell_Mediapunta": 12,
  "Hugo_Cabrera_Soto_Extremo": 15,
  "Alvaro_Benitez_Roca_Delantero": 11,
};
const dir = new URL("../public/demo/jugadores/", import.meta.url);
fs.mkdirSync(dir, { recursive: true });
let fail = 0;
for (const [key, img] of Object.entries(PLAYERS)) {
  const file = new URL(`${key}.jpg`, dir);
  if (fs.existsSync(file)) continue;
  try {
    const r = await fetch(`https://i.pravatar.cc/600?img=${img}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    console.log("✓", key);
  } catch (e) { fail++; console.error("✗", key, e.message); }
}
process.exit(fail ? 1 : 0);
