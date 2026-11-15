"use client";

import Lenis from "lenis";
import { MotionConfig, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { setLenis } from "@/lib/scroll";

const IntroCtx = createContext<{ ready: boolean; setReady: (v: boolean) => void }>({ ready: false, setReady: () => {} });
export const useIntro = () => useContext(IntroCtx);

export function Providers({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const isAdmin = usePathname().startsWith("/admin");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced || isAdmin) { setLenis(null); return; }
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, anchors: false });
    setLenis(lenis);
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); setLenis(null); };
  }, [reduced, isAdmin]);

  return (
    <MotionConfig reducedMotion="user">
      <IntroCtx.Provider value={{ ready, setReady }}>{children}</IntroCtx.Provider>
    </MotionConfig>
  );
}
