import { club, siteUrl } from "@/config/club";
import { NAV_ALL } from "@/config/nav";
import { loadContent } from "@/lib/content";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Intro } from "@/components/layout/Intro";
import { Club } from "@/components/sections/Club";
import { Community } from "@/components/sections/Community";
import { Contact } from "@/components/sections/Contact";
import { Gallery } from "@/components/sections/Gallery";
import { Hero } from "@/components/sections/Hero";
import { Matches } from "@/components/sections/Matches";
import { Squad } from "@/components/sections/Squad";

export const dynamic = "force-static";

export default function Home() {
  const c = loadContent(); // se ejecuta al compilar
  const has: Record<string, boolean> = {
    plantilla: c.players.length > 0,
    galeria: c.gallery.length > 0,
    partidos: c.matches.length > 0,
    comunidad: club.socials.length > 0,
  };
  const nav = NAV_ALL.filter((n) => has[n.id] ?? true);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: `${club.name} ${club.suffix}`,
    sport: "Soccer",
    url: siteUrl,
    slogan: club.slogan,
    sameAs: club.socials.map((s) => s.url),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Intro />
      <Header nav={[...nav]} />
      <main id="main">
        <Hero matches={c.matches} builtAt={c.builtAt} />
        <Club content={c.club} players={c.players} matches={c.matches} />
        {has.plantilla && <Squad players={c.players} />}
        {has.galeria && <Gallery gallery={c.gallery} />}
        {has.partidos && <Matches matches={c.matches} builtAt={c.builtAt} />}
        <Contact />
        {has.comunidad && <Community />}
      </main>
      <Footer />
    </>
  );
}
