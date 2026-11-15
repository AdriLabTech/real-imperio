"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { club } from "@/config/club";
import type { Match } from "@/lib/types";
import { splitMatches, useNow } from "@/lib/matches";
import { dateLong, dayNum, monthShort, timeOf, weekday } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHead } from "./SectionHead";

function useCountdown(iso?: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!iso) return;
    const tick = () => setLeft(Math.max(0, +new Date(iso) - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const outcome = (m: Match) => (!m.score ? "—" : m.score.us > m.score.them ? "V" : m.score.us < m.score.them ? "D" : "E");
const OUTCOME_STYLE: Record<string, string> = { V: "bg-primary text-ink", E: "bg-paper/20 text-paper", D: "bg-secondary text-ink", "—": "bg-paper/10" };

function Team({ name, us }: { name: string; us?: boolean }) {
  return <span className={`display text-[clamp(1.6rem,3.4vw,3rem)] ${us ? "text-paper" : "text-paper/80"}`}>{name}</span>;
}

export function Matches({ matches, builtAt }: { matches: Match[]; builtAt: number }) {
  const { upcoming, results } = splitMatches(matches, useNow(builtAt));
  const next = upcoming[0];
  const cd = useCountdown(next?.date);
  const [tab, setTab] = useState<"calendar" | "results">("calendar");
  const shown = tab === "calendar" ? upcoming : results;

  const left = (m: Match) => (m.home ? club.shortName : m.opponent);
  const right = (m: Match) => (m.home ? m.opponent : club.shortName);

  return (
    <section id="partidos" className="relative py-28 md:py-40" aria-label="Partidos y resultados">
      <div className="gutter"><SectionHead index="04" kicker="Partidos" title="Calendario y resultados." outline="MATCH" /></div>

      {next && (
        <Reveal className="gutter mt-14">
          <article className="relative overflow-hidden border border-paper/15 bg-ink-2">
            <div className="absolute inset-0 bg-[radial-gradient(50%_80%_at_85%_50%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent)]" />
            <div className="pitch-lines absolute inset-0" />
            <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <p className="mono flex items-center gap-2 text-primary"><span className="size-2 animate-pulse rounded-full bg-primary" /> Próximo partido · {next.competition ?? "Amistoso"}</p>
                <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <Team name={left(next)} us={next.home} /><span className="display text-primary text-3xl">VS</span><Team name={right(next)} us={!next.home} />
                </div>
                <ul className="mono mt-6 space-y-2 text-muted !normal-case !tracking-wide !text-sm">
                  <li className="flex items-center gap-2"><CalendarDays size={16} className="text-primary" /> {dateLong(next.date)} · {timeOf(next.date)} h</li>
                  {next.venue && <li className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {next.venue}</li>}
                  {next.note && <li className="pl-6">{next.note}</li>}
                </ul>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center" role="timer" aria-label="Cuenta atrás hasta el próximo partido">
                {(["d", "h", "m", "s"] as const).map((k) => (
                  <div key={k} className="clip-cut border border-paper/15 bg-ink/70 py-5">
                    <p className="display text-[clamp(2.2rem,5vw,4rem)] tabular-nums text-primary">{cd ? String(cd[k]).padStart(2, "0") : "--"}</p>
                    <p className="mono !text-[0.6rem] text-muted">{{ d: "Días", h: "Horas", m: "Min", s: "Seg" }[k]}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </Reveal>
      )}

      <div className="gutter mt-14 flex gap-2" role="tablist" aria-label="Partidos">
        {([["calendar", "Calendario"], ["results", "Últimos resultados"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`mono border px-5 py-3 transition-colors ${tab === id ? "border-primary bg-primary text-ink" : "border-paper/25 hover:border-primary hover:text-primary"}`}>{label}</button>
        ))}
      </div>

      <div className="gutter mt-6" role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.ul key={tab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="border-t border-paper/15">
            {shown.map((m) => (
              <li key={m.id} className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-paper/15 py-5 transition-colors hover:bg-paper/[0.03] sm:gap-8 sm:py-6">
                <div className="w-14 text-center sm:w-20">
                  <p className="display text-4xl text-primary sm:text-5xl">{dayNum(m.date)}</p>
                  <p className="mono !text-[0.65rem] text-muted">{monthShort(m.date)} · {weekday(m.date)}</p>
                </div>
                <div className="min-w-0">
                  <p className="display flex flex-wrap items-baseline gap-x-3 text-[clamp(1.4rem,3vw,2.4rem)]"><span>{left(m)}</span><span className="text-muted text-lg">vs</span><span>{right(m)}</span></p>
                  <p className="mono mt-1 text-muted !normal-case !tracking-wide !text-xs">{[m.competition, m.venue, !m.score ? `${timeOf(m.date)} h` : null].filter(Boolean).join(" · ")}</p>
                </div>
                {m.score ? (
                  <div className="flex items-center gap-3">
                    <span className="display text-4xl tabular-nums sm:text-5xl">{m.home ? `${m.score.us}–${m.score.them}` : `${m.score.them}–${m.score.us}`}</span>
                    <span className={`mono grid size-8 place-items-center !tracking-normal ${OUTCOME_STYLE[outcome(m)]}`} aria-label={{ V: "Victoria", E: "Empate", D: "Derrota", "—": "" }[outcome(m)]}>{outcome(m)}</span>
                  </div>
                ) : (
                  <span className="mono border border-paper/25 px-3 py-2 text-muted">{tab === "results" ? "Sin resultado" : m.home ? "Local" : "Visitante"}</span>
                )}
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
        {shown.length === 0 && <p className="border-b border-paper/15 py-8 text-muted">{tab === "calendar" ? "No hay partidos programados por ahora." : "Todavía no hay resultados."}</p>}
      </div>
    </section>
  );
}
