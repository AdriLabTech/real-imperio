import Link from "next/link";
import { club } from "@/config/club";
import { Marquee } from "@/components/motion/Marquee";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-paper/10 pt-16">
      <Marquee className="display text-[clamp(3rem,8vw,7rem)] text-paper/90" items={[club.slogan, `${club.name} ${club.suffix}`, club.tagline]} speed={50} />
      <div className="gutter mt-16 grid gap-10 pb-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="display text-3xl">{club.name} <span className="text-primary">{club.suffix}</span></p>
          <p className="mt-3 max-w-sm text-muted">{club.tagline}</p>
        </div>
        <div className="mono space-y-2 text-muted">
          <p className="text-paper">Contacto</p>
          <p><a className="hover:text-primary" href={`https://wa.me/${club.whatsapp.number}`} target="_blank" rel="noopener noreferrer">WhatsApp {club.whatsapp.display}</a></p>
          <p><a className="hover:text-primary" href="#contacto">Proponer un partido</a></p>
        </div>
        <div className="mono space-y-2 text-muted">
          <p className="text-paper">Síguenos</p>
          {club.socials.map((s) => <p key={s.id}><a className="hover:text-primary" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></p>)}
        </div>
      </div>
      <div className="gutter mono flex flex-col gap-2 border-t border-paper/10 py-6 text-muted sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} {club.name} {club.suffix}</span>
        <Link href="/privacidad" className="hover:text-primary">Política de privacidad</Link>
      </div>
    </footer>
  );
}
