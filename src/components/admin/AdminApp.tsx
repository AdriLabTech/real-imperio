"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { asset } from "@/config/club";
import { GitHub, type Op } from "@/lib/admin/github";
import { decryptVault, type VaultFile } from "@/lib/admin/vault";
import {
  galleryOps, jsonOp, load, matchOps, playerOps, validateAjustes, validateGallery, validateMatches, validatePlayers, type Loaded,
} from "@/lib/admin/model";
import { GalleryTab } from "./GalleryTab";
import { MatchesTab } from "./MatchesTab";
import { PlayersTab } from "./PlayersTab";
import { SiteTab } from "./SiteTab";
import { Btn, Errors, Text } from "./ui";

type Stage = "boot" | "novault" | "locked" | "opening" | "ready";
const TABS = [["jugadores", "Jugadores"], ["partidos", "Partidos"], ["galeria", "Galería"], ["web", "Web y contacto"]] as const;
const IDLE_MS = 20 * 60 * 1000;

export function AdminApp() {
  const [stage, setStage] = useState<Stage>("boot");
  const [vault, setVault] = useState<VaultFile | null>(null);
  const [pw, setPw] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [gh, setGh] = useState<GitHub | null>(null);
  const [orig, setOrig] = useState<Loaded | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("jugadores");
  const [errors, setErrors] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(asset("/admin-vault.json"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((v: VaultFile) => { setVault(v); setStage("locked"); })
      .catch(() => setStage("novault"));
  }, []);

  const lock = useCallback(() => { setGh(null); setOrig(null); setData(null); setPw(""); setStage("locked"); setDone(null); setErrors([]); }, []);

  // Cierre de sesión por inactividad: el token descifrado solo vive en memoria.
  useEffect(() => {
    if (stage !== "ready") return;
    const reset = () => { if (idle.current) clearTimeout(idle.current); idle.current = setTimeout(lock, IDLE_MS); };
    const ev = ["pointerdown", "keydown", "scroll"] as const;
    ev.forEach((e) => window.addEventListener(e, reset, { passive: true })); reset();
    return () => { ev.forEach((e) => window.removeEventListener(e, reset)); if (idle.current) clearTimeout(idle.current); };
  }, [stage, lock]);

  const open = async (e: React.FormEvent) => {
    e.preventDefault(); if (!vault || stage === "opening") return;
    setLoginErr(""); setStage("opening");
    try {
      const payload = await decryptVault(vault, pw);
      setPw("");
      const g = new GitHub(payload);
      await g.check();
      const l = await load(g);
      setGh(g); setOrig(l); setData(structuredClone(l)); setStage("ready");
    } catch (er) { setLoginErr(er instanceof Error ? er.message : "Error desconocido."); setStage("locked"); }
  };

  const ops = useMemo<Op[]>(() => {
    if (!orig || !data) return [];
    return [
      ...playerOps(orig.players, data.players, orig.playersText),
      ...matchOps(data.matches, orig.matchesText),
      ...galleryOps(orig.gallery, data.gallery, orig.galleryText),
      ...jsonOp("content/club.json", data.club, orig.clubText),
      ...jsonOp("content/ajustes.json", data.ajustes, orig.ajustesText),
    ];
  }, [orig, data]);

  const publish = async () => {
    if (!gh || !data) return;
    const errs = [...validatePlayers(data.players), ...validateMatches(data.matches), ...validateGallery(data.gallery), ...validateAjustes(data.ajustes)];
    setErrors(errs); if (errs.length) return;
    const files = ops.length;
    if (!confirm(`Se publicarán cambios en ${files} archivo${files === 1 ? "" : "s"}. La web se actualizará en 1–2 minutos. ¿Continuar?`)) return;
    setPublishing(true); setDone(null);
    try {
      const sha = await gh.commit("Actualización desde el panel de administración", ops);
      const l = await load(gh); setOrig(l); setData(structuredClone(l));
      setDone(`Publicado (commit ${sha.slice(0, 7)}). GitHub está desplegando la web: en 1–2 minutos verás los cambios.`);
    } catch (er) { setErrors([er instanceof Error ? er.message : "No se pudo publicar."]); }
    setPublishing(false);
  };

  const patch = (p: Partial<Loaded>) => setData((d) => (d ? { ...d, ...p } : d));

  /* ---------- pantallas ---------- */
  const shell = (children: React.ReactNode) => <main id="main" className="min-h-screen bg-ink text-paper">{children}</main>;

  if (stage === "boot") return shell(<p className="gutter pt-24 text-muted">Cargando…</p>);
  if (stage === "novault")
    return shell(
      <div className="gutter mx-auto max-w-xl pt-24">
        <h1 className="display text-5xl">Panel no activado</h1>
        <p className="mt-4 text-muted">Falta <code>public/admin-vault.json</code>. Ejecuta en tu ordenador <code className="text-paper">npm run admin:sellar -- --repo usuario/repositorio</code>, sube el archivo con git y vuelve aquí. Las instrucciones completas están en el README.</p>
      </div>,
    );
  if (stage === "locked" || stage === "opening")
    return shell(
      <div className="gutter mx-auto max-w-md pt-28">
        <p className="mono text-primary">Real Imperio F.C.</p>
        <h1 className="display mt-2 text-5xl">Administración</h1>
        <form onSubmit={open} className="mt-8 grid gap-4" autoComplete="off">
          <label className="block"><span className="mono mb-1.5 block text-muted">Contraseña</span>
            <Text type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" autoFocus required aria-describedby="login-err" /></label>
          {loginErr && <p id="login-err" role="alert" className="text-secondary">{loginErr}</p>}
          <Btn kind="gold" type="submit" disabled={stage === "opening" || !pw}>{stage === "opening" ? "Comprobando…" : "Entrar"}</Btn>
        </form>
        <p className="mt-6 text-xs text-muted">La contraseña no se envía a ningún servidor: se usa en tu navegador para descifrar el acceso al repositorio.</p>
      </div>,
    );

  if (!gh || !data) return null;
  return shell(
    <div className="mx-auto max-w-6xl pb-32">
      <header className="gutter sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-paper/15 bg-ink/90 py-4 backdrop-blur">
        <div><p className="mono text-primary">Administración</p><p className="mono text-muted !normal-case !tracking-normal">{gh.label}</p></div>
        <div className="flex items-center gap-3">
          <span className="mono text-muted" aria-live="polite">{ops.length ? `${ops.length} archivo${ops.length === 1 ? "" : "s"} con cambios` : "Sin cambios"}</span>
          <Btn kind="gold" onClick={publish} disabled={publishing || ops.length === 0}>{publishing ? "Publicando…" : "Publicar cambios"}</Btn>
          <Btn onClick={lock}>Salir</Btn>
        </div>
      </header>

      <div className="gutter pt-6">
        {done && <p role="status" className="mb-4 border border-primary/60 bg-primary/10 p-3 text-primary">{done} <a className="underline" href={gh.actionsUrl} target="_blank" rel="noopener noreferrer">Ver despliegue</a></p>}
        <Errors list={errors} />
        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Secciones">
          {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id} className={`mono border px-4 py-2.5 transition-colors ${tab === id ? "border-primary bg-primary text-ink" : "border-paper/25 hover:border-primary hover:text-primary"}`}>{label}</button>)}
        </nav>
        {tab === "jugadores" && <PlayersTab gh={gh} list={data.players} setList={(players) => patch({ players })} />}
        {tab === "partidos" && <MatchesTab list={data.matches} setList={(matches) => patch({ matches })} />}
        {tab === "galeria" && <GalleryTab gh={gh} list={data.gallery} setList={(gallery) => patch({ gallery })} />}
        {tab === "web" && <SiteTab club={data.club} setClub={(club) => patch({ club })} ajustes={data.ajustes} setAjustes={(ajustes) => patch({ ajustes })} />}
      </div>
    </div>,
  );
}
