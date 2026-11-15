"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { club } from "@/config/club";
import type { NavItem } from "@/config/nav";
import { lockScroll, scrollToId } from "@/lib/scroll";
import { Crest } from "@/components/ui/Crest";

export function Header({ nav }: { nav: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    nav.forEach((n) => { const el = document.getElementById(n.id); if (el) io.observe(el); });
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  }, [nav]);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const go = (id: string) => { setOpen(false); setTimeout(() => scrollToId(id), open ? 450 : 0); };

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter,padding] duration-500 ${scrolled ? "bg-ink/70 py-3 backdrop-blur-xl" : "py-6"}`}>
        <div className="gutter flex items-center justify-between">
          <a href="#top" onClick={(e) => { e.preventDefault(); go("top"); }} className="flex items-center gap-3" aria-label={`${club.name} ${club.suffix} — inicio`}>
            <Crest size={scrolled ? 34 : 44} />
            <span className="display hidden text-xl sm:block">{club.name} <span className="text-primary">{club.suffix}</span></span>
          </a>

          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            {nav.slice(0, 5).map((n) => (
              <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); go(n.id); }} className="mono relative px-3 py-2 transition-colors hover:text-primary" aria-current={active === n.id ? "true" : undefined}>
                {n.label}
                {active === n.id && <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-3 right-3 h-[2px] bg-primary" />}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="menu"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="mono group flex items-center gap-3 border border-paper/30 bg-ink/40 px-4 py-2.5 backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              <span>{open ? "Cerrar" : "Menú"}</span>
              <span className="flex w-5 flex-col gap-[5px]" aria-hidden>
                <span className={`h-[2px] bg-current transition-transform duration-300 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
                <span className={`h-[2px] bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
                <span className={`h-[2px] bg-current transition-transform duration-300 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu" role="dialog" aria-modal="true" aria-label="Menú principal"
            initial={{ clipPath: "circle(0% at calc(100% - 60px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 60px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 60px) 40px)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-primary text-ink"
          >
            <div className="gutter pt-20">
              <ul className="space-y-1">
                {nav.map((n, i) => (
                  <li key={n.id} className="overflow-hidden">
                    <motion.a
                      href={`#${n.id}`}
                      onClick={(e) => { e.preventDefault(); go(n.id); }}
                      initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="display group flex items-baseline gap-4 text-[clamp(2.6rem,9vw,7.5rem)] transition-[padding] duration-300 hover:pl-6"
                    >
                      <span className="mono !text-xs opacity-60">0{i + 1}</span>
                      <span className="group-hover:[-webkit-text-stroke:2px_var(--ink)] group-hover:text-transparent">{n.label}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
              <div className="mono mt-10 flex flex-wrap gap-x-8 gap-y-2">
                <a href={`https://wa.me/${club.whatsapp.number}`} target="_blank" rel="noopener noreferrer">WhatsApp {club.whatsapp.display}</a>
                {club.socials.map((s) => <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
