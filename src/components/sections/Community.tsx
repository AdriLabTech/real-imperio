"use client";

import { ArrowUpRight, Link as LinkIcon } from "lucide-react";
import { club } from "@/config/club";
import { Reveal } from "@/components/motion/Reveal";
import { Facebook, Instagram, TikTok, XIcon, Youtube } from "@/components/ui/BrandIcons";
import { SectionHead } from "./SectionHead";

const FallbackIcon = ({ size }: { size?: number }) => <LinkIcon size={size} />;
const ICONS: Record<string, (p: { size?: number }) => React.ReactElement> = { instagram: Instagram, tiktok: TikTok, youtube: Youtube, facebook: Facebook, x: XIcon };

export function Community() {
  const [main, ...rest] = club.socials;
  if (!main) return null;
  const MainIcon = ICONS[main.id] ?? FallbackIcon;
  return (
    <section id="comunidad" className="relative py-28 md:py-40" aria-label="Comunidad y redes sociales">
      <div className="gutter"><SectionHead index="06" kicker="Comunidad" title="El imperio también vive fuera del campo." /></div>

      <div className="gutter mt-14 grid gap-px border border-paper/15 bg-paper/15 lg:grid-cols-[2fr_1fr]">
        <Reveal className="bg-ink">
          <a href={main.url} target="_blank" rel="noopener noreferrer" className="group relative flex min-h-[22rem] flex-col justify-between overflow-hidden p-8 transition-colors duration-500 hover:bg-primary hover:text-ink md:p-12" aria-label={`${main.label}: ${main.handle} (se abre en una pestaña nueva)`}>
            <div className="flex items-start justify-between"><MainIcon size={44} /><ArrowUpRight size={36} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" /></div>
            <div>
              <p className="mono mb-3 opacity-70">Síguenos</p>
              <p className="display text-[clamp(3rem,8vw,7rem)]">{main.label}</p>
              <p className="mono mt-3 opacity-80 !normal-case !tracking-wide">{main.handle}</p>
            </div>
          </a>
        </Reveal>
        <Reveal delay={0.1} className="bg-ink">
          <div className="flex h-full min-h-[14rem] flex-col justify-between p-8">
            <p className="text-lg leading-relaxed text-muted">Resultados, convocatorias y detrás de las cámaras. Y si quieres jugar contra nosotros, también puedes escribirnos por WhatsApp.</p>
            <a href={`https://wa.me/${club.whatsapp.number}`} target="_blank" rel="noopener noreferrer" className="mono mt-8 inline-flex w-fit items-center gap-2 border border-paper/30 px-5 py-3 transition-colors hover:border-primary hover:text-primary">WhatsApp {club.whatsapp.display} <ArrowUpRight size={16} /></a>
          </div>
        </Reveal>
        {rest.map((s) => (
          <Reveal key={s.id} className="bg-ink lg:col-span-2"><a href={s.url} target="_blank" rel="noopener noreferrer" className="display block p-6 text-3xl hover:text-primary">{s.label} <span className="mono !text-xs text-muted">{s.handle}</span></a></Reveal>
        ))}
      </div>
    </section>
  );
}
