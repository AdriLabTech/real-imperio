"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, GalleryItem } from "@/lib/types";
import { asset } from "@/config/club";
import { lockScroll } from "@/lib/scroll";
import { Visual } from "@/components/ui/Visual";
import { SectionHead } from "./SectionHead";

const CATS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Todo" }, { id: "partidos", label: "Partidos" }, { id: "entrenamientos", label: "Entrenos" }, { id: "celebraciones", label: "Celebraciones" }, { id: "momentos", label: "Momentos" },
];

function Tile({ item, onOpen, index }: { item: GalleryItem; onOpen: (i: GalleryItem) => void; index: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  return (
    <motion.li layout initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -8% 0px" }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.8, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }} className="mb-4 break-inside-avoid sm:mb-5">
      <button ref={ref} onClick={() => onOpen(item)} data-cursor={item.type === "photo" ? "Ampliar" : "Play"} className="group relative block w-full overflow-hidden bg-ink-2 text-left" style={{ aspectRatio: item.ratio }}>
        <span className="sr-only">{item.type === "photo" ? "Ampliar foto" : "Reproducir vídeo"}:</span>
        <motion.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110">
          {item.type === "video" && item.src ? (
            <video src={`${asset(item.src)}#t=0.6`} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
          ) : (
            <Visual seed={item.id} src={item.type === "photo" ? item.src : undefined} alt="" variant="scene" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent opacity-80 transition-opacity group-hover:opacity-100" />
        <span className="mono absolute left-4 top-4 bg-ink/70 px-2 py-1 backdrop-blur">{item.category}</span>
        {item.type !== "photo" && <span className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-primary text-ink"><Play size={16} fill="currentColor" /></span>}
        <div className="absolute inset-x-0 bottom-0 translate-y-3 p-4 transition-transform duration-500 group-hover:translate-y-0">
          <p className="display text-2xl">{item.title}</p>
        </div>
      </button>
    </motion.li>
  );
}

function Lightbox({ items, index, onClose, onNav }: { items: GalleryItem[]; index: number; onClose: () => void; onNav: (d: number) => void }) {
  const item = items[index];
  useEffect(() => {
    lockScroll(true);
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") onNav(1); if (e.key === "ArrowLeft") onNav(-1); };
    window.addEventListener("keydown", k);
    return () => { lockScroll(false); window.removeEventListener("keydown", k); };
  }, [onClose, onNav]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={item.title} onClick={onClose}>
      <div className="flex items-center justify-between p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <p className="mono text-muted">{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</p>
        <button onClick={onClose} aria-label="Cerrar" autoFocus className="grid size-11 place-items-center border border-paper/30 transition-colors hover:border-primary hover:text-primary"><X size={18} /></button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.figure key={item.id} initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }} className="relative h-full max-h-[70vh] w-full max-w-4xl" style={{ aspectRatio: Math.min(item.ratio, 1.78) }}>
            {item.type === "video" && item.src ? (
              <video src={asset(item.src)} controls autoPlay playsInline className="absolute inset-0 h-full w-full object-contain" aria-label={item.title} />
            ) : item.type === "youtube" ? (
              <iframe src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0`} title={item.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 h-full w-full" />
            ) : (
              <Visual seed={item.id} src={item.src} alt={`${item.title}${item.caption ? `: ${item.caption}` : ""}`} variant="scene" />
            )}
                      </motion.figure>
        </AnimatePresence>
        <button onClick={() => onNav(-1)} aria-label="Anterior" className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center border border-paper/30 bg-ink/60 hover:border-primary hover:text-primary sm:left-6"><ChevronLeft /></button>
        <button onClick={() => onNav(1)} aria-label="Siguiente" className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center border border-paper/30 bg-ink/60 hover:border-primary hover:text-primary sm:right-6"><ChevronRight /></button>
      </div>
      <div className="p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="display text-3xl">{item.title}</p>
        {item.caption && <p className="mt-1 text-muted">{item.caption}</p>}
      </div>
    </motion.div>
  );
}

export function Gallery({ gallery }: { gallery: GalleryItem[] }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const items = cat === "all" ? gallery : gallery.filter((g) => g.category === cat);
  const nav = useCallback((d: number) => setOpenIdx((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);
  const close = useCallback(() => setOpenIdx(null), []);
  const secRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: secRef, offset: ["start end", "end start"] });
  const bgX = useTransform(scrollYProgress, [0, 1], ["5%", "-25%"]);

  return (
    <section id="galeria" ref={secRef} className="relative overflow-hidden py-28 md:py-40" aria-label="Galería">
      <motion.div aria-hidden style={{ x: bgX }} className="display outline-text pointer-events-none absolute right-0 top-24 -z-10 whitespace-nowrap text-[clamp(9rem,26vw,24rem)] opacity-[0.12]">MOMENTOS MOMENTOS</motion.div>
      <div className="gutter"><SectionHead index="03" kicker="Galería" title="Lo que no cabe en un resultado." /></div>

      <div className="gutter mt-12 flex flex-wrap gap-2" role="group" aria-label="Filtrar galería">
        {CATS.map((c) => <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id} className={`mono border px-4 py-2.5 transition-colors ${cat === c.id ? "border-primary bg-primary text-ink" : "border-paper/25 hover:border-primary hover:text-primary"}`}>{c.label}</button>)}
      </div>

      <ul className="gutter mt-10 columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3">
        <AnimatePresence mode="popLayout">
          {items.map((it, i) => <Tile key={it.id} item={it} index={i} onOpen={() => setOpenIdx(items.indexOf(it))} />)}
        </AnimatePresence>
      </ul>
      {items.length === 0 && <p className="gutter mt-10 text-muted">Aún no hay elementos en esta categoría.</p>}

      <AnimatePresence>{openIdx !== null && <Lightbox key="lb" items={items} index={openIdx} onClose={close} onNav={nav} />}</AnimatePresence>
    </section>
  );
}
