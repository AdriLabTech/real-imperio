"use client";

import dynamic from "next/dynamic";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { club } from "@/config/club";
import type { Match } from "@/lib/types";
import { splitMatches, useNow } from "@/lib/matches";
import { dateLong, timeOf } from "@/lib/format";
import { scrollToId } from "@/lib/scroll";
import { Crest } from "@/components/ui/Crest";
import { MaskWords } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { useIntro } from "@/components/motion/Providers";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), { ssr: false });

function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

export function Hero({ matches, builtAt }: { matches: Match[]; builtAt: number }) {
  const upcoming = splitMatches(matches, useNow(builtAt)).upcoming[0];
  const { ready } = useIntro();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [gl, setGl] = useState(false);
  const [small, setSmall] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mountScene, setMountScene] = useState(false);

  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const t1x = useTransform(mx, (v) => v * -26);
  const t2x = useTransform(mx, (v) => v * 40);
  const ty = useTransform(my, (v) => v * 14);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capacidades del dispositivo (WebGL, tamaño) solo en cliente
    setSmall(matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4);
    setGl(!reduced && hasWebGL() && !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [reduced]);

  // La escena 3D es trabajo pesado: se monta cuando termina la intro y el navegador está ocioso.
  useEffect(() => {
    if (!ready || !gl) return;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const id = ric(() => setMountScene(true), { timeout: 2500 });
    return () => { if (window.cancelIdleCallback) window.cancelIdleCallback(id as number); };
  }, [ready, gl]);

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse") return;
    mx.set((e.clientX / innerWidth - 0.5) * 2);
    my.set((e.clientY / innerHeight - 0.5) * 2);
  };

  const [first, ...rest] = club.name.split(" ");
  const second = rest.join(" ") || club.suffix;
  const line = "display select-none whitespace-nowrap text-[clamp(4.6rem,21vw,22rem)] leading-[0.82]";

  return (
    <section id="top" ref={ref} onPointerMove={onMove} className="relative isolate h-[100svh] min-h-[640px] overflow-hidden" aria-label="Presentación">
      {/* Atmósfera */}
      <div className="pitch-lines absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_65%_40%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]" />
      <div className="absolute -top-20 left-[8%] -z-10 h-[140%] w-[22vw] origin-top -rotate-[14deg] bg-gradient-to-b from-primary/20 to-transparent blur-2xl" />
      <div className="absolute -top-20 right-[6%] -z-10 h-[140%] w-[14vw] origin-top rotate-[18deg] bg-gradient-to-b from-secondary/20 to-transparent blur-2xl" />

      {/* Titular gigante en dos capas: la primera línea queda detrás del balón y la segunda delante */}
      {[0, 1].map((layer) => (
        <motion.div
          key={layer}
          aria-hidden={layer === 1 || undefined}
          style={{ y: textY, opacity: fade }}
          className={`pointer-events-none absolute inset-0 ${layer === 0 ? "z-0" : "z-20"} flex flex-col justify-start gutter pt-28 sm:pt-32`}
        >
          <motion.div style={{ x: t1x, y: ty }} className={layer === 1 ? "invisible" : ""}>
            <MaskWords as={layer === 0 ? "h1" : "div"} trigger="mount" active delay={0.5} text={first} className={`${line} text-paper`} />
          </motion.div>
          <motion.div style={{ x: t2x, y: ty }} className={`self-end ${layer === 0 ? "invisible" : ""}`}>
            <MaskWords as="div" trigger="mount" active delay={0.65} text={second} className={`${line} text-primary`} />
          </motion.div>
        </motion.div>
      ))}
      <span className="sr-only">{club.name} {club.suffix}</span>

      {/* Escena 3D / respaldo estático */}
      <motion.div style={{ y: sceneY }} className="absolute inset-0 z-10" initial={{ opacity: 0, scale: 0.9 }} animate={ready ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
        {gl ? (
          mountScene && <HeroScene small={small} active={visible} />
        ) : (
          <div className="flex h-full items-center justify-center"><Crest size={small ? 180 : 300} animate={ready} /></div>
        )}
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 z-30 gutter pb-8 sm:pb-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="display text-[clamp(1.8rem,4.4vw,3.6rem)] leading-[0.95]">{club.slogan}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Magnetic>
                <a href="#contacto" onClick={(e) => { e.preventDefault(); scrollToId("contacto"); }} className="mono clip-cut inline-block bg-primary px-6 py-4 text-ink transition-colors hover:bg-paper">
                  Proponer un partido →
                </a>
              </Magnetic>
              <a href="#plantilla" onClick={(e) => { e.preventDefault(); scrollToId("plantilla"); }} className="mono border border-paper/30 px-6 py-4 backdrop-blur transition-colors hover:border-primary hover:text-primary">
                Conocer la plantilla
              </a>
            </div>
          </div>

          {upcoming && (
            <a
              href="#partidos" onClick={(e) => { e.preventDefault(); scrollToId("partidos"); }}
              className="group clip-cut-tl hidden max-w-xs border border-paper/15 bg-ink/60 p-5 backdrop-blur-md transition-colors hover:border-primary sm:block"
            >
              <p className="mono flex items-center gap-2 text-primary"><span className="size-2 animate-pulse rounded-full bg-primary" /> Próximo partido</p>
              <p className="display mt-3 text-3xl">{club.shortName} <span className="text-muted">vs</span> {upcoming.opponent}</p>
              <p className="mono mt-2 text-muted normal-case tracking-wide">{dateLong(upcoming.date)} · {timeOf(upcoming.date)}</p>
            </a>
          )}
        </div>
      </div>

      {/* Indicador de scroll */}
      <motion.div initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 1.8 }} className="absolute bottom-10 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-3 xl:flex" aria-hidden>
        <span className="mono text-muted">Scroll</span>
        <span className="relative h-14 w-px overflow-hidden bg-paper/20"><motion.span className="absolute inset-x-0 top-0 h-5 bg-primary" animate={{ y: [-20, 56] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }} /></span>
      </motion.div>
    </section>
  );
}
