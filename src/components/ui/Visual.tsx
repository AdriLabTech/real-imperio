import { asset, club } from "@/config/club";
import { Shatter } from "./Shatter";

export type VisualSeed = string;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const rnd = (seed: number, i: number) => {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  // Redondeado: Math.sin difiere en el último decimal entre Node y el navegador (desajuste de hidratación).
  return Math.round((x - Math.floor(x)) * 1e4) / 1e4;
};

interface Props {
  seed: VisualSeed;
  /** Foto real. Si existe, se usa en lugar de la composición generada. */
  src?: string;
  alt: string;
  variant?: "player" | "scene";
  number?: number;
  priority?: boolean;
  className?: string;
  /** Se mantiene por compatibilidad (el export estático no usa srcset). */
  sizes?: string;
}

const { primary: GOLD, secondary: EMBER, paper: PAPER } = club.colors;
const TONES = [
  { a: GOLD, b: EMBER },
  { a: GOLD, b: PAPER },
  { a: PAPER, b: GOLD },
  { a: GOLD, b: GOLD },
];

/**
 * Imagen de DEMOSTRACIÓN generada: haces de luz, halftone y líneas de campo.
 * Sustituible por fotografía real pasando `src` (config en src/data/*).
 */
export function Visual({ seed, src, alt, variant = "scene", number, priority, className = "" }: Props) {
  if (src)
    return (
      <Shatter>
        {/* eslint-disable-next-line @next/next/no-img-element -- export estático: sin optimizador de imágenes */}
        <img src={asset(src)} alt={alt} draggable={false} loading={priority ? "eager" : "lazy"} decoding="async" className={`pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-top [-webkit-user-drag:none] ${className}`} />
      </Shatter>
    );

  const h = hash(seed);
  const tone = TONES[h % TONES.length];
  const id = `v${h}`;
  const beamX = 120 + rnd(h, 1) * 560;
  const beamW = 180 + rnd(h, 2) * 260;
  const tilt = -18 + rnd(h, 3) * 36;
  const ballX = 120 + rnd(h, 4) * 560;
  const ballY = 620 + rnd(h, 5) * 200;

  return (
    <svg
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      className={`absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <radialGradient id={`${id}-glow`} cx={beamX / 800} cy="0.05" r="0.9">
          <stop offset="0" stopColor={tone.a} stopOpacity="0.85" />
          <stop offset="0.55" stopColor={tone.b} stopOpacity="0.18" />
          <stop offset="1" stopColor="#0b0c09" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#0b0c09" stopOpacity="0" />
          <stop offset="1" stopColor="#0b0c09" stopOpacity="0.95" />
        </linearGradient>
        <pattern id={`${id}-dots`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="7" cy="7" r="3.2" fill="#0b0c09" />
        </pattern>
        <mask id={`${id}-m`}>
          <rect width="800" height="1000" fill="#fff" />
          <rect width="800" height="1000" fill={`url(#${id}-dots)`} opacity="0.55" />
        </mask>
        <clipPath id={`${id}-clip`}><rect width="800" height="1000" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="800" height="1000" fill="#0b0c09" />
        <rect width="800" height="1000" fill={`url(#${id}-glow)`} mask={`url(#${id}-m)`} />
        {/* Haz de foco */}
        <polygon
          points={`${beamX - 20},0 ${beamX + 20},0 ${beamX + beamW},1000 ${beamX - beamW},1000`}
          fill={tone.a}
          opacity="0.09"
          transform={`rotate(${tilt} ${beamX} 0)`}
        />
        {/* Líneas de campo en perspectiva */}
        <g stroke={PAPER} strokeOpacity="0.16" strokeWidth="2" fill="none">
          <path d="M-100 1000 L330 640 H470 L900 1000" />
          <path d="M60 860 H740" />
          <ellipse cx="400" cy="690" rx="150" ry="34" />
          <path d="M400 640 V1000" />
        </g>

        {variant === "player" ? (
          <g>
            {number !== undefined && (
              <text x="400" y="640" textAnchor="middle" fontFamily="var(--font-anton), Impact, sans-serif" fontSize="620" fill="none" stroke={tone.a} strokeWidth="3" strokeOpacity="0.55">
                {number}
              </text>
            )}
            {/* Busto: silueta recortada con luz lateral */}
            <path d="M120 1000 C130 800 230 740 330 720 L470 720 C570 740 670 800 680 1000 Z" fill="#14150f" />
            <path d="M120 1000 C130 800 230 740 330 720 L370 720 C300 790 250 880 250 1000 Z" fill={tone.b} opacity="0.5" />
            <rect x="360" y="650" width="80" height="90" fill="#14150f" />
            <ellipse cx="400" cy="560" rx="92" ry="112" fill="#14150f" />
            <path d="M308 560 C308 470 360 448 400 448 C380 520 372 600 340 665 C318 640 308 600 308 560 Z" fill={tone.a} opacity="0.55" />
            <path d="M300 520 C305 450 350 420 400 420 C450 420 495 450 500 520 C470 470 330 470 300 520 Z" fill="#0b0c09" />
          </g>
        ) : (
          <g>
            {/* Balón en movimiento con estela */}
            <g opacity="0.6">
              {[0, 1, 2, 3].map((i) => (
                <circle key={i} cx={ballX - i * 46} cy={ballY + i * 12} r={46 - i * 6} fill="none" stroke={tone.a} strokeWidth="2" opacity={0.5 - i * 0.12} />
              ))}
            </g>
            <circle cx={ballX} cy={ballY} r="52" fill={PAPER} />
            <polygon points={`${ballX},${ballY - 20} ${ballX + 19},${ballY - 6} ${ballX + 12},${ballY + 16} ${ballX - 12},${ballY + 16} ${ballX - 19},${ballY - 6}`} fill="#0b0c09" />
            {/* Siluetas de jugadores */}
            {[0, 1, 2].map((i) => {
              const x = 140 + rnd(h, 10 + i) * 520;
              const s = 0.7 + rnd(h, 20 + i) * 0.7;
              const y = 700 + i * 55;
              return (
                <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#14150f" stroke={tone.b} strokeOpacity="0.55" strokeWidth="2">
                  <circle cx="0" cy="-130" r="20" />
                  <path d="M-28 -105 L28 -105 L40 -30 L-40 -30 Z M-30 -30 L-8 80 H6 L-4 -30 Z M30 -30 L52 70 H38 L12 -30 Z" />
                </g>
              );
            })}
          </g>
        )}
        <rect width="800" height="1000" fill={`url(#${id}-fade)`} />
        <text x="24" y="976" fontFamily="var(--font-mono), monospace" fontSize="16" letterSpacing="3" fill={PAPER} fillOpacity="0.4">
          IMAGEN DE DEMOSTRACIÓN
        </text>
      </g>
    </svg>
  );
}
