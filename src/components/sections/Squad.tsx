"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Player, Position } from "@/lib/types";
import { lockScroll } from "@/lib/scroll";
import { Visual } from "@/components/ui/Visual";
import { SectionHead } from "./SectionHead";

const FILTERS: { id: Position | "ALL"; label: string }[] = [
  { id: "ALL", label: "Todos" }, { id: "POR", label: "Porteros" }, { id: "DEF", label: "Defensas" }, { id: "MED", label: "Medios" }, { id: "DEL", label: "Delanteros" },
];

function Card({ p, i, onOpen }: { p: Player; i: number; onOpen: (p: Player) => void }) {
  const reduced = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 160, damping: 16 });
  const ry = useSpring(useMotionValue(0), { stiffness: 160, damping: 16 });
  const px = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });
  const py = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });
  const shine = useTransform([px, py], ([x, y]) => `radial-gradient(circle at ${50 + (x as number) * 50}% ${50 + (y as number) * 50}%, rgba(236,232,220,0.28), transparent 55%)`);

  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ry.set(x * 16); rx.set(-y * 16); px.set(x * 2); py.set(y * 2);
  };
  const leave = () => { rx.set(0); ry.set(0); px.set(0); py.set(0); };

  return (
    <motion.li layout initial={{ opacity: 0, y: 60, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`w-[72vw] shrink-0 snap-center sm:w-[340px] lg:w-[380px] ${i % 2 ? "sm:mt-16" : ""}`} style={{ perspective: 1000 }}>
      <motion.button
        onClick={() => onOpen(p)} onPointerMove={move} onPointerLeave={leave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group relative block aspect-[3/4.2] w-full overflow-hidden bg-ink-2 text-left" data-cursor="Ver"
      >
        <motion.div layoutId={`img-${p.id}`} className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.07]">
          <Visual seed={p.id} src={p.photo} alt={p.photo ? `Foto de ${p.name}` : ""} variant="player" number={p.number} />
        </motion.div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--ink)_0%,color-mix(in_oklab,var(--ink)_70%,transparent)_28%,transparent_55%),linear-gradient(to_bottom,color-mix(in_oklab,var(--ink)_55%,transparent)_0%,transparent_30%)]" />
        <motion.div aria-hidden style={{ background: shine }} className="pointer-events-none absolute inset-0 mix-blend-overlay" />
        <span className="sr-only">{p.number !== undefined ? `Dorsal ${p.number}, ` : ""}{p.name}. Abrir ficha.</span>
        {p.number !== undefined && <span className="display absolute right-3 top-2 text-[7.5rem] leading-none text-paper/90 [transform:translateZ(60px)]" aria-hidden>{p.number}</span>}
        <div className="absolute inset-x-0 bottom-0 p-5 [transform:translateZ(40px)]">
          <p className="mono text-primary">{p.positionLabel}</p>
          <div>
            <p className="display mt-1 text-3xl leading-[0.95] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1">{p.nickname ?? p.name}</p>
          </div>
          <p className="mono mt-1 -translate-y-1 text-paper/0 transition-all duration-500 group-hover:translate-y-0 group-hover:text-paper/80 !normal-case !tracking-wide">{p.nickname ? p.name : "Ver ficha →"}</p>
        </div>
      </motion.button>
    </motion.li>
  );
}

function Sheet({ p, onClose }: { p: Player; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    lockScroll(true);
    closeRef.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => { lockScroll(false); window.removeEventListener("keydown", k); };
  }, [onClose]);

  const facts = [["Edad", p.age && `${p.age} años`], ["Altura", p.height], ["Pie", p.foot], ["Nacionalidad", p.nationality]].filter(([, v]) => v) as [string, string][];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/85 backdrop-blur-md sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Ficha de ${p.name}`}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[100svh] w-full max-w-5xl overflow-y-auto bg-ink-2 sm:max-h-[90vh] md:grid-cols-2" data-lenis-prevent>
        <motion.div layoutId={`img-${p.id}`} className="relative aspect-[4/4.4] md:aspect-auto md:min-h-[560px]"><Visual seed={p.id} src={p.photo} alt={`${p.photo ? "Foto" : "Imagen provisional"} de ${p.name}`} variant="player" number={p.number} /></motion.div>
        <div className="p-6 sm:p-10">
          <button ref={closeRef} onClick={onClose} aria-label="Cerrar ficha" className="absolute right-4 top-4 z-10 grid size-11 place-items-center border border-paper/30 bg-ink/60 backdrop-blur transition-colors hover:border-primary hover:text-primary"><X size={18} /></button>
          <p className="mono text-primary">{p.number !== undefined ? `#${p.number} · ` : ""}{p.positionLabel}</p>
          <h3 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">{p.name}</h3>
          {p.nickname && <p className="mono mt-2 text-muted">«{p.nickname}»</p>}
          {p.bio && <p className="mt-6 text-lg leading-relaxed text-muted">{p.bio}</p>}
          {facts.length > 0 && <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-paper/15 py-6">{facts.map(([k, v]) => <div key={k}><dt className="mono text-muted">{k}</dt><dd className="display mt-1 text-2xl">{v}</dd></div>)}</dl>}
          {p.stats && (
            <div className="mt-8 space-y-4">
              {p.stats.map((s, i) => (
                <div key={s.label}>
                  <div className="mono mb-1 flex justify-between"><span>{s.label}</span><span className="text-primary">{s.value}</span></div>
                  <div className="h-[6px] bg-paper/10"><motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${s.value}%` }} transition={{ delay: 0.3 + i * 0.12, duration: 1, ease: [0.16, 1, 0.3, 1] }} /></div>
                </div>
              ))}
              
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Squad({ players }: { players: Player[] }) {
  const [filter, setFilter] = useState<Position | "ALL">("ALL");
  const [open, setOpen] = useState<Player | null>(null);
  const list = filter === "ALL" ? players : players.filter((p) => p.position === filter);
  const scroller = useRef<HTMLUListElement>(null);
  const close = useCallback(() => setOpen(null), []);

  // Arrastrar con ratón para desplazar; en táctil es scroll nativo con snap.
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });

  if (players.length === 0) {
    return (
      <section id="plantilla" className="relative py-28 md:py-40" aria-label="Plantilla">
        <div className="gutter"><SectionHead index="02" kicker="Plantilla" title="Los que salen al campo." outline="11" /></div>
        <div className="gutter mt-12">
          <div className="border border-paper/15 p-8 md:p-12">
            <p className="mono text-primary">Plantilla en preparación</p>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">Todavía no hay jugadores publicados. En cuanto se añadan desde el panel, aparecerán aquí con su dorsal, posición y ficha.</p>
          </div>
        </div>
      </section>
    );
  }

  const onDown = (e: React.PointerEvent) => { if (e.pointerType !== "mouse" || !scroller.current) return; drag.current = { down: true, x: e.clientX, left: scroller.current.scrollLeft, moved: false }; };
  const onMove = (e: React.PointerEvent) => { const d = drag.current; if (!d.down || !scroller.current) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 5) d.moved = true; scroller.current.scrollLeft = d.left - dx; };
  const onUp = () => { drag.current.down = false; };
  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * Math.min(760, window.innerWidth * 0.8), behavior: "smooth" });
  const onClickCapture = (e: React.MouseEvent) => { if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false; } };

  return (
    <section id="plantilla" className="relative py-28 md:py-40" aria-label="Plantilla">
      <div className="gutter"><SectionHead index="02" kicker="Plantilla" title="Los que salen al campo." outline="11" /></div>

      <div className="gutter mt-12 flex flex-wrap gap-2" role="group" aria-label="Filtrar por posición">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} className={`mono border px-4 py-2.5 transition-colors ${filter === f.id ? "border-primary bg-primary text-ink" : "border-paper/25 hover:border-primary hover:text-primary"}`}>{f.label}</button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="mono hidden text-muted md:block">Arrastra o usa las flechas</span>
          <button onClick={() => scrollBy(-1)} aria-label="Jugadores anteriores" className="grid size-11 place-items-center border border-paper/25 transition-colors hover:border-primary hover:text-primary"><ChevronLeft size={18} /></button>
          <button onClick={() => scrollBy(1)} aria-label="Jugadores siguientes" className="grid size-11 place-items-center border border-paper/25 transition-colors hover:border-primary hover:text-primary"><ChevronRight size={18} /></button>
        </div>
      </div>

      <ul ref={scroller} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp} onClickCapture={onClickCapture} onDragStart={(e) => e.preventDefault()} tabIndex={-1}
        className="mt-10 flex cursor-grab select-none snap-x snap-mandatory gap-5 overflow-x-auto active:cursor-grabbing px-[var(--gutter)] pb-20 [scrollbar-width:none] sm:snap-none sm:gap-7 [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => <Card key={p.id} p={p} i={i} onOpen={setOpen} />)}
        </AnimatePresence>
      </ul>

      <div className="gutter">
        <p className="mono mb-4 flex items-center gap-3 text-primary"><span className="h-px w-10 bg-primary/60" />Convocatoria · {list.length} {list.length === 1 ? "jugador" : "jugadores"}</p>
        <ol className="border-t border-paper/15">
          {list.map((p) => (
            <li key={p.id} className="border-b border-paper/15">
              <button onClick={() => setOpen(p)} className="group grid w-full grid-cols-[3.5rem_1fr] items-start gap-x-4 gap-y-1 py-5 text-left transition-colors hover:bg-paper/[0.04] md:grid-cols-[6rem_1.1fr_9rem_2fr] md:items-center md:gap-x-8 md:py-6">
                <span className="display row-span-3 text-5xl text-primary md:row-span-1 md:text-6xl" aria-label={p.number !== undefined ? `Dorsal ${p.number}` : "Sin dorsal"}>{p.number ?? "—"}</span>
                <span className="display text-2xl transition-transform duration-300 group-hover:translate-x-2 md:text-3xl">{p.name}{p.nickname && <span className="mono ml-3 align-middle !text-xs text-muted">«{p.nickname}»</span>}</span>
                <span className="mono text-muted">{p.positionLabel}</span>
                <span className="text-muted">{p.bio ?? ""}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="mono mt-4 text-muted !normal-case !tracking-wide !text-xs">Pulsa un jugador para ver su ficha completa.</p>
      </div>

      <AnimatePresence>{open && <Sheet key="sheet" p={open} onClose={close} />}</AnimatePresence>
    </section>
  );
}
