"use client";

import { motion, type HTMLMotionProps } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

/** Entrada al hacer scroll: desplazamiento corto + fundido. Solo anima una vez. */
export function Reveal({ delay = 0, y = 36, className, children, ...rest }: { delay?: number; y?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Titular que sube palabra a palabra desde una máscara. Mantiene el texto accesible. */
export function MaskWords({
  text, className = "", delay = 0, as: Tag = "h2", trigger = "view", active = true,
}: { text: string; className?: string; delay?: number; as?: "h1" | "h2" | "h3" | "p" | "div"; trigger?: "view" | "mount"; active?: boolean }) {
  const words = text.split(" ");
  const M = motion[Tag] as typeof motion.h2;
  const anim = trigger === "view"
    ? { whileInView: "show" as const, viewport: { once: true, margin: "0px 0px -10% 0px" } }
    : { animate: active ? "show" : "hidden" };
  return (
    <M className={className} initial="hidden" {...anim} transition={{ staggerChildren: 0.07, delayChildren: delay }}>
      {words.map((w, i) => (
        <span key={i} className="-mt-[0.2em] inline-block overflow-hidden pb-[0.06em] pt-[0.2em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: "108%", rotate: 3 }, show: { y: "0%", rotate: 0 } }}
            transition={{ duration: 0.95, ease }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </M>
  );
}
