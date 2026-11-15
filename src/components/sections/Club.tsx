"use client";

import { animate, motion, useInView, useMotionValue, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { club } from "@/config/club";
import type { ClubContent, Match, Player } from "@/lib/types";
import { Reveal, MaskWords } from "@/components/motion/Reveal";
import { Visual } from "@/components/ui/Visual";
import { SectionHead } from "./SectionHead";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v) + suffix; } });
    return () => c.stop();
  }, [inView, mv, value, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

export function Club({ content: clubContent, players, matches }: { content: ClubContent; players: Player[]; matches: Match[] }) {
  const played = matches.filter((m) => m.score);
  const stats = [
    { value: players.length, suffix: "", label: "Jugadores" },
    { value: played.length, suffix: "", label: "Partidos jugados" },
    { value: played.filter((m) => m.score!.us > m.score!.them).length, suffix: "", label: "Victorias" },
    { value: played.reduce((n, m) => n + m.score!.us, 0), suffix: "", label: "Goles a favor" },
  ].filter((s) => s.value > 0);
  const quoteRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: quoteRef, offset: ["start end", "end start"] });
  const bigX = useTransform(scrollYProgress, [0, 1], ["10%", "-35%"]);

  return (
    <section id="club" className="relative py-28 md:py-44" aria-label="El club">
      <div className="gutter"><SectionHead index="01" kicker="El club" title="Una forma de jugar. Una forma de ser." outline="CLUB" /></div>

      <Reveal className="gutter mt-12 max-w-3xl"><p className="text-xl leading-relaxed text-paper md:text-2xl">{clubContent.manifesto}</p></Reveal>

      {/* Valores */}
      {clubContent.values.length > 0 && <div className="gutter mt-32 md:mt-48">
        <Reveal className="mono mb-8 text-primary">04 — Valores</Reveal>
        <ul className="border-t border-paper/15">
          {clubContent.values.map((v, i) => (
            <li key={v.word}><Reveal delay={i * 0.06} y={20}>
              <div className="group relative flex flex-col gap-2 overflow-hidden border-b border-paper/15 py-6 md:flex-row md:items-center md:justify-between md:py-8" data-cursor="">
                <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-primary transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
                <span className="display text-[clamp(2.6rem,7vw,6rem)] transition-colors duration-300 group-hover:text-ink md:group-hover:translate-x-4">{v.word}</span>
                <span className="max-w-xs text-muted transition-colors group-hover:text-ink md:mr-6">{v.text}</span>
              </div>
            </Reveal></li>
          ))}
        </ul>
      </div>}

      {/* Cifras */}
      {stats.length > 0 && <dl className="gutter mt-24 grid grid-cols-2 gap-y-10 md:grid-cols-4">
        {stats.map((s) => (
          <Reveal key={s.label}>
            <dt className="mono order-2 mt-2 text-muted">{s.label}</dt>
            <dd className="display text-[clamp(3.4rem,8vw,7rem)] text-primary"><Counter value={s.value} suffix={s.suffix} /></dd>
          </Reveal>
        ))}
      </dl>}

      {/* Frase */}
      {clubContent.quote.text && <div ref={quoteRef} className="relative mt-32 overflow-hidden py-24 md:mt-48 md:py-40">
        <motion.div aria-hidden style={{ x: bigX }} className="display outline-text pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(12rem,40vw,36rem)] opacity-20">
          {`${club.shortName} · ${club.shortName} · ${club.shortName}`}
        </motion.div>
        <figure className="gutter relative mx-auto max-w-5xl text-center">
          <MaskWords as="p" text={`“${clubContent.quote.text}”`} className="display text-[clamp(2rem,6vw,5.4rem)] leading-[0.95]" />
          <figcaption className="mono mt-8 text-primary">— {clubContent.quote.by}</figcaption>
        </figure>
      </div>}
    </section>
  );
}
