"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { club } from "@/config/club";
import { lockScroll } from "@/lib/scroll";
import { Crest } from "@/components/ui/Crest";
import { useIntro } from "@/components/motion/Providers";

/** Intro cinematográfica: se muestra una vez por sesión. Con reduced-motion se salta. */
export function Intro() {
  const { setReady } = useIntro();
  const reduced = useReducedMotion();
  const [show, setShow] = useState(true);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("intro") === "1"; } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage/reduced-motion solo se conocen en cliente
    if (reduced || seen) { setShow(false); setReady(true); return; }
    lockScroll(true);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1200);
      setPct(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => { setShow(false); lockScroll(false); setReady(true); try { sessionStorage.setItem("intro", "1"); } catch {} }, 120);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); lockScroll(false); };
  }, [reduced, setReady]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          role="status"
          aria-label="Cargando"
          className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-ink"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
        >
          <div className="pitch-lines absolute inset-0" />
          <Crest size={120} animate />
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="display mt-8 text-3xl tracking-wide">
            {club.name} <span className="text-primary">{club.suffix}</span>
          </motion.p>
          <div className="absolute bottom-10 left-[var(--gutter)] right-[var(--gutter)] flex items-end justify-between">
            <span className="mono text-muted">Entrando al campo</span>
            <span className="display text-6xl tabular-nums text-primary">{String(pct).padStart(2, "0")}</span>
          </div>
          <div className="absolute bottom-0 left-0 h-[3px] bg-primary" style={{ width: `${pct}%` }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
