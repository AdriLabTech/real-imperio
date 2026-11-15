"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Cursor propio: solo con puntero fino (ratón) y sin reduced-motion. Crece sobre [data-cursor]. */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const isAdmin = usePathname().startsWith("/admin");
  const [label, setLabel] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.3 });

  useEffect(() => {
    const ok = matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ok || isAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detección de capacidades del navegador, solo posible tras montar
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");
    const move = (e: PointerEvent) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button, [role=button], input, textarea, select, label");
      setHover(!!t);
      setLabel(t?.dataset.cursor ?? null);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.classList.remove("has-cursor");
    };
  }, [x, y, isAdmin]);

  if (!enabled) return null;
  return (
    <>
      <motion.div aria-hidden style={{ x: sx, y: sy }} className="pointer-events-none fixed left-0 top-0 z-[100] mix-blend-difference">
        <motion.div
          animate={{ width: label ? 92 : hover ? 56 : 12, height: label ? 92 : hover ? 56 : 12 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-paper flex items-center justify-center"
        >
          {label && <span className="mono !text-[0.6rem] text-ink">{label}</span>}
        </motion.div>
      </motion.div>
    </>
  );
}
