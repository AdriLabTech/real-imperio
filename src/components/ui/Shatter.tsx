"use client";

import { useEffect, useRef } from "react";

/* ---- Ajustes del efecto (todo en un sitio) ---- */
const TILE = 34; // tamaño aproximado de cada pieza (px)
const RADIUS = 0.44; // radio de influencia del cursor (fracción del ancho)
const PUSH = 20; // separación máxima en el plano (px)
const LIFT = 46; // cuánto se adelantan hacia el espectador (px, con perspectiva)
const TILT = 24; // inclinación 3D máxima (grados)
const TURN = 6; // giro en el plano (grados)
const WAVE = 3.2; // amplitud de la ondulación líquida (px)
const SHOCK = 9; // impulso de la onda de choque al entrar
const GOLD = "217,173,43"; // RGB del acento: brillo y fracturas (= club.colors.primary)

const rand = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // −1…1 determinista
};

// Canales animados por pieza: x, y, z, rotX, rotY, rotZ, escala
const N = 7;
interface Tile { el: HTMLDivElement; cx: number; cy: number; i: number; p: Float32Array; v: Float32Array }

/**
 * Envuelve una <img>. Con el ratón encima la foto se «descompone» en piezas que, según su cercanía al cursor,
 * se apartan, se adelantan en 3D y se inclinan, con ondas, sombras y brillo dorado en las fracturas.
 * Al alejar el cursor se recomponen con un muelle. El overlay existe solo durante el hover (coste cero en reposo)
 * y no actúa con táctil ni con prefers-reduced-motion.
 */
export function Shatter({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const host = root.closest<HTMLElement>("button, a") ?? root.parentElement;
    if (!host) return;

    let overlay: HTMLDivElement | null = null;
    let glow: HTMLDivElement, sheen: HTMLDivElement, layer: HTMLDivElement;
    let tiles: Tile[] = [];
    let raf = 0, last = 0, inside = false;
    const cur = { x: 0, y: 0, tx: 0, ty: 0, speed: 0, power: 0 }; // power: 0→1 al entrar, 1→0 al salir
    let W = 0, H = 0;

    const build = () => {
      const img = root.querySelector("img");
      if (!img || !img.complete || !img.naturalWidth) return false;
      const r = root.getBoundingClientRect();
      W = r.width; H = r.height;
      const cols = Math.max(4, Math.round(W / TILE)), rows = Math.max(4, Math.round(H / TILE));
      const tw = W / cols, th = H / rows;
      const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight); // object-fit: cover; object-position: top
      const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc, ox = (W - dw) / 2;
      const src = img.currentSrc || img.src;

      overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.dataset.shatter = "";
      overlay.style.cssText = "position:absolute;inset:0;pointer-events:none;perspective:620px";
      // 1) luz dorada que se cuela por las grietas
      glow = document.createElement("div");
      glow.style.cssText = "position:absolute;inset:0;opacity:0";
      // 2) piezas
      layer = document.createElement("div");
      layer.dataset.shatterTiles = "";
      layer.style.cssText = "position:absolute;inset:0;transform-style:preserve-3d";
      tiles = [];
      for (let ry = 0; ry < rows; ry++) for (let cx = 0; cx < cols; cx++) {
        const el = document.createElement("div");
        const x = cx * tw, y = ry * th;
        el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${tw + 0.6}px;height:${th + 0.6}px;background-image:url("${src}");background-size:${dw}px ${dh}px;background-position:${ox - x}px ${-y}px;will-change:transform`;
        layer.appendChild(el);
        const p = new Float32Array(N); p[6] = 1;
        tiles.push({ el, cx: x + tw / 2, cy: y + th / 2, i: ry * cols + cx, p, v: new Float32Array(N) });
      }
      // 3) brillo especular que sigue al cursor
      sheen = document.createElement("div");
      sheen.style.cssText = "position:absolute;inset:0;mix-blend-mode:soft-light;opacity:0";
      overlay.append(glow, layer, sheen);
      root.appendChild(overlay);
      img.style.visibility = "hidden";
      return true;
    };

    const destroy = () => {
      overlay?.remove(); overlay = null; tiles = [];
      const img = root.querySelector("img");
      if (img) img.style.visibility = "";
    };

    const frame = (t: number) => {
      const dt = last ? Math.min(2.5, Math.max(0.25, (t - last) / 16.67)) : 1; last = t; // nunca 0: evita NaN en el primer fotograma
      const px = cur.x, py = cur.y;
      cur.x += (cur.tx - cur.x) * Math.min(1, 0.2 * dt);
      cur.y += (cur.ty - cur.y) * Math.min(1, 0.2 * dt);
      const sp = Math.hypot(cur.x - px, cur.y - py) / dt; // px por fotograma
      cur.speed += (sp - cur.speed) * Math.min(1, 0.15 * dt);
      cur.power += ((inside ? 1 : 0) - cur.power) * Math.min(1, 0.12 * dt);
      const boost = 1 + Math.min(1, cur.speed / 14) * 0.55; // más rápido = más intenso
      const R = W * RADIUS * (1 + Math.min(1, cur.speed / 14) * 0.25);
      let moving = false;
      const a = 0.13 * dt, damp = Math.pow(0.8, dt);

      for (const k of tiles) {
        const dx = k.cx - cur.x, dy = k.cy - cur.y, d = Math.hypot(dx, dy) || 1;
        const f = inside ? Math.max(0, 1 - d / R) : 0;
        const e = f * f * (3 - 2 * f);
        // dirección radial con desviación propia de cada pieza: fracturas irregulares, no una cruz
        const ja = rand(k.i, 6) * 0.75, cj = Math.cos(ja), sj = Math.sin(ja);
        const ux = (dx / d) * cj - (dy / d) * sj, uy = (dx / d) * sj + (dy / d) * cj;
        const ripple = Math.sin(d / 20 - t * 0.0065) * f * WAVE; // oleaje que se aleja del cursor
        const tg = [
          (ux * (e * PUSH * boost * (0.45 + 0.7 * Math.abs(rand(k.i, 1)))) + ux * ripple),
          (uy * (e * PUSH * boost * (0.45 + 0.7 * Math.abs(rand(k.i, 2)))) + uy * ripple),
          e * LIFT * (0.55 + 0.45 * Math.abs(rand(k.i, 4))),
          -uy * e * TILT * boost, // se inclinan alejándose del cursor
          ux * e * TILT * boost,
          rand(k.i, 3) * e * TURN * boost,
          1 + 0.11 * f * f * f - 0.045 * f * (1 - f) * 4, // lupa en el centro, aprieta en el anillo
        ];
        let energy = 0;
        for (let c = 0; c < N; c++) {
          k.v[c] = (k.v[c] + (tg[c] - k.p[c]) * a) * damp;
          k.p[c] += k.v[c] * dt;
          energy += Math.abs(c === 6 ? 1 - k.p[c] : k.p[c]) + Math.abs(k.v[c]);
        }
        if (energy > 0.03) {
          moving = true;
          const [x, y, z, rx, ry, rz, s] = k.p;
          const e2 = Math.min(1, Math.abs(z) / LIFT);
          k.el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${s.toFixed(3)})`;
          k.el.style.boxShadow = e2 > 0.02
            ? `0 ${(7 * e2).toFixed(1)}px ${(20 * e2).toFixed(1)}px rgba(0,0,0,${(0.6 * e2).toFixed(2)}), 0 0 0 ${(0.9 * e2 + 0.2).toFixed(2)}px rgba(${GOLD},${(0.75 * e2).toFixed(2)}), inset 0 0 0 999px rgba(255,236,190,${(0.2 * e2).toFixed(3)})`
            : "";
        } else { k.el.style.transform = ""; k.el.style.boxShadow = ""; }
      }

      glow.style.opacity = String(cur.power);
      glow.style.background = `radial-gradient(circle at ${cur.x}px ${cur.y}px, rgba(${GOLD},0.6) 0, rgba(${GOLD},0.22) ${R * 0.6}px, transparent ${R * 1.15}px)`;
      sheen.style.opacity = String(cur.power * 0.9);
      sheen.style.background = `radial-gradient(circle at ${cur.x}px ${cur.y}px, rgba(255,255,255,0.55) 0, transparent ${R * 0.75}px)`;
      overlay!.style.perspectiveOrigin = `${cur.x}px ${cur.y}px`;

      if (!inside && !moving && cur.power < 0.01) { raf = 0; last = 0; destroy(); return; }
      raf = requestAnimationFrame(frame);
    };

    const place = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      cur.tx = e.clientX - r.left; cur.ty = e.clientY - r.top;
    };
    const enter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      inside = true;
      const fresh = !overlay;
      if (fresh && !build()) { inside = false; return; }
      place(e); cur.x = cur.tx; cur.y = cur.ty;
      if (fresh) { // onda de choque: las piezas reciben un golpe radial desde el punto de entrada
        cur.power = 0;
        for (const k of tiles) {
          const dx = k.cx - cur.x, dy = k.cy - cur.y, d = Math.hypot(dx, dy) || 1;
          const f = Math.max(0, 1 - d / (W * 0.8));
          k.v[0] = (dx / d) * SHOCK * f; k.v[1] = (dy / d) * SHOCK * f; k.v[2] = SHOCK * 2.2 * f; k.v[5] = rand(k.i, 5) * 4 * f;
        }
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const move = (e: PointerEvent) => { if (inside) place(e); };
    const leave = () => { inside = false; };

    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf); destroy();
    };
  }, []);

  return <div ref={ref} className="absolute inset-0">{children}</div>;
}
