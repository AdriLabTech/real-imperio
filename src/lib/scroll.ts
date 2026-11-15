import type Lenis from "lenis";

let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { instance = l; };

/** Desplazamiento a una sección: usa Lenis si está activo y scroll nativo si no. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset: 0, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView({ behavior: "auto", block: "start" });
  history.replaceState(null, "", `#${id}`);
}
export const lockScroll = (lock: boolean) => (lock ? instance?.stop() : instance?.start());
