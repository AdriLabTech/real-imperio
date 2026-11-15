"use client";

import { motion } from "motion/react";
import { asset, club } from "@/config/club";

/** Escudo: usa club.crestSrc si existe; si no, genera uno con las iniciales y los colores del club. */
export function Crest({ size = 96, animate = false, className = "" }: { size?: number; animate?: boolean; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- export estático
  if (club.crestSrc) return <img src={asset(club.crestSrc)} alt={`Escudo de ${club.name}`} width={size} height={size} className={className} />;
  const path = "M50 4 L92 16 V52 C92 76 74 92 50 100 C26 92 8 76 8 52 V16 Z";
  return (
    <svg viewBox="0 0 100 104" width={size} height={size * 1.04} role="img" aria-label={`Escudo de ${club.name}`} className={className}>
      <motion.path
        d={path}
        fill="var(--ink)"
        stroke="var(--primary)"
        strokeWidth={3}
        initial={animate ? { pathLength: 0, fillOpacity: 0 } : false}
        animate={animate ? { pathLength: 1, fillOpacity: 1 } : undefined}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <path d="M50 14 L82 23 V52 C82 70 68 82 50 89 C32 82 18 70 18 52 V23 Z" fill="none" stroke="var(--paper)" strokeOpacity={0.35} strokeWidth={1} />
      <path d="M8 44 H92" stroke="var(--primary)" strokeWidth={10} strokeOpacity={0.95} />
      <circle cx="50" cy="44" r="14" fill="var(--ink)" stroke="var(--primary)" strokeWidth={2} />
      <text x="50" y="50" textAnchor="middle" fontFamily="var(--font-anton), Impact, sans-serif" fontSize="19" fill="var(--paper)">
        {club.shortName.slice(0, 1)}
      </text>
      <text x="50" y="79" textAnchor="middle" fontFamily="var(--font-anton), Impact, sans-serif" fontSize="15" letterSpacing="1" fill="var(--paper)">
        {club.shortName}
      </text>
    </svg>
  );
}
