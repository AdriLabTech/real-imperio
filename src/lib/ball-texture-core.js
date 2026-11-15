/**
 * Algoritmo del balón (icosaedro truncado por Voronoi esférico). Se ejecuta UNA vez con
 * `node scripts/bake-ball.mjs` y el resultado se sirve como imagen estática (0 coste de CPU en el cliente).
 */
function bake(w, h) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const ico = [];
  for (const a of [-1, 1]) for (const b of [-phi, phi]) ico.push([0, a, b], [a, b, 0], [b, 0, a]);
  const pent = ico.map(norm);
  const hex = [];
  const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  for (let i = 0; i < ico.length; i++) for (let j = i + 1; j < ico.length; j++) for (let k = j + 1; k < ico.length; k++)
    if ([d(ico[i], ico[j]), d(ico[j], ico[k]), d(ico[i], ico[k])].every((x) => Math.abs(x - 2) < 1e-6))
      hex.push(norm([ico[i][0] + ico[j][0] + ico[k][0], ico[i][1] + ico[j][1] + ico[k][1], ico[i][2] + ico[j][2] + ico[k][2]]));
  const centers = [...pent, ...hex];
  const BIAS = 0.045;
  const mk = () => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const color = mk(), bump = mk();
  const cc = color.getContext("2d"), bc = bump.getContext("2d");
  const ci = cc.createImageData(w, h), bi = bc.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - (y + 0.5) / h) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
    for (let x = 0; x < w; x++) {
      const lon = ((x + 0.5) / w) * 2 * Math.PI;
      const dx = cl * Math.cos(lon), dy = sl, dz = -cl * Math.sin(lon);
      let b1 = -2, b2 = -2, i1 = 0;
      for (let c = 0; c < centers.length; c++) {
        const v = centers[c];
        const s = dx * v[0] + dy * v[1] + dz * v[2] + (c < 12 ? BIAS : 0);
        if (s > b1) { b2 = b1; b1 = s; i1 = c; } else if (s > b2) b2 = s;
      }
      const seam = 1 - Math.min(1, Math.max(0, (b1 - b2 - 0.004) / 0.018));
      const base = i1 < 12 ? [14, 15, 11] : [238, 234, 222];
      const sh = 1 - seam * 0.8, o = (y * w + x) * 4;
      ci.data[o] = base[0] * sh; ci.data[o + 1] = base[1] * sh; ci.data[o + 2] = base[2] * sh; ci.data[o + 3] = 255;
      const bv = 255 - seam * 200;
      bi.data[o] = bi.data[o + 1] = bi.data[o + 2] = bv; bi.data[o + 3] = 255;
    }
  }
  cc.putImageData(ci, 0, 0); bc.putImageData(bi, 0, 0);
  return { "ball-color": color.toDataURL("image/webp", 0.9), "ball-bump": bump.toDataURL("image/webp", 0.85) };
}
