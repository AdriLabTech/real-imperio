import type { Metadata } from "next";
import Link from "next/link";
import { club } from "@/config/club";

export const metadata: Metadata = { title: "Política de privacidad" };

function S({ t, children }: { t: string; children: React.ReactNode }) {
  return <section className="mt-10"><h2 className="display text-3xl text-primary">{t}</h2><div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div></section>;
}

export default function Privacy() {
  const ig = club.socials[0];
  return (
    <main id="main" className="gutter mx-auto max-w-3xl py-24">
      <Link href="/" className="mono text-primary">← Volver</Link>
      <h1 className="display mt-6 text-[clamp(3rem,8vw,6rem)]">Política de privacidad</h1>

      <S t="Resumen">
        <p>Esta web <strong className="text-paper">no tiene servidor propio ni base de datos</strong>: no guarda ni recibe los datos que escribes en el formulario. Está alojada en GitHub Pages.</p>
      </S>
      <S t="Formulario «Proponer un partido»">
        <p>Los datos que introduces (nombre del equipo, fecha y, si quieres, contacto, lugar y comentarios) se usan únicamente para redactar un mensaje de WhatsApp dirigido al club ({club.whatsapp.display}). El mensaje se compone en tu navegador y <strong className="text-paper">solo se envía si tú pulsas «Enviar» en WhatsApp</strong>.</p>
        <p>A partir de ese momento, el tratamiento lo realiza WhatsApp (Meta) según sus propias condiciones, y el club recibe tu mensaje con la finalidad de gestionar el partido propuesto. Base jurídica: tu consentimiento al enviarlo (art. 6.1.a RGPD). El club conservará la conversación el tiempo necesario para organizar el partido.</p>
      </S>
      <S t="Tus derechos">
        <p>Puedes pedir acceso, rectificación o supresión de lo que nos hayas enviado escribiendo al mismo WhatsApp ({club.whatsapp.display}){ig ? <> o por <a className="text-paper underline" href={ig.url} target="_blank" rel="noopener noreferrer">{ig.label}</a></> : null}. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
      </S>
      <S t="Cookies y terceros">
        <p>No usamos cookies ni analítica. En tu navegador solo se guarda, durante la sesión, un valor técnico para no repetir la animación de entrada. Los vídeos de YouTube (si los hay) usan el modo de privacidad ampliada y no se cargan hasta que pulsas reproducir. Los enlaces a redes sociales y a WhatsApp te llevan a servicios de terceros con su propia política.</p>
      </S>
      <p className="mono mt-12 text-muted">Si el club pasa a tratar datos de otra forma (p. ej. un servidor), esta política deberá actualizarse.</p>
    </main>
  );
}
