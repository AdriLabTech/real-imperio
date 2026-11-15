import { MaskWords, Reveal } from "@/components/motion/Reveal";

export function SectionHead({ index, kicker, title, outline, className = "" }: { index: string; kicker: string; title: string; outline?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {outline && <div aria-hidden className="display outline-text pointer-events-none absolute -top-10 right-0 -z-10 hidden select-none text-[clamp(8rem,22vw,22rem)] opacity-30 md:block">{outline}</div>}
      <Reveal className="mono flex items-center gap-4 text-primary"><span>{index}</span><span className="h-px w-12 bg-primary/60" /><span>{kicker}</span></Reveal>
      <MaskWords text={title} className="display mt-5 max-w-5xl text-[clamp(2.8rem,8.5vw,8rem)]" />
    </div>
  );
}
