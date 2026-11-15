"use client";
import { useEffect, useState } from "react";
import type { Match } from "./types";

/**
 * El sitio es estático (GitHub Pages): «próximo» y «resultado» se deciden en el navegador con la hora actual,
 * así la web no se queda desfasada aunque nadie recompile. El primer render usa la hora de compilación (sin desajuste de hidratación).
 */
export function useNow(builtAt: number) {
  const [now, setNow] = useState(builtAt);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- la hora real solo existe en el cliente
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(id); }, []);
  return now;
}

export function splitMatches(matches: Match[], now: number) {
  const upcoming = matches.filter((m) => !m.score && +new Date(m.date) + 2 * 3600e3 > now).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const results = matches.filter((m) => m.score || +new Date(m.date) + 2 * 3600e3 <= now).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return { upcoming, results };
}
