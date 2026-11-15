#!/usr/bin/env node
// Crea public/admin-vault.json: el token de GitHub CIFRADO con tu contraseña.
// La contraseña y el token se piden por teclado (sin eco) y NO se guardan en ningún sitio.
//   npm run admin:sellar -- --repo usuario/real-imperio [--branch main] [--no-check]
import fs from "node:fs";
import { execSync } from "node:child_process";
import { encryptVault, MIN_PASSWORD_LENGTH } from "../src/lib/admin/vault.ts";

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const die = (m) => { console.error("✗ " + m); process.exit(1); };

let repoArg = flag("repo");
if (!repoArg) {
  try { repoArg = /github\.com[:/]([^/]+\/[^/.\s]+)/.exec(execSync("git remote get-url origin", { stdio: ["ignore", "pipe", "ignore"] }).toString())?.[1]; } catch { /* sin remoto */ }
}
if (!repoArg || !/^[\w.-]+\/[\w.-]+$/.test(repoArg)) die("Indica el repositorio: --repo usuario/nombre-del-repo");
const [owner, repo] = repoArg.split("/");
const branch = flag("branch") ?? "main";

/** Lee una línea sin eco (TTY) o de la entrada estándar (tuberías, solo para pruebas automáticas). */
const piped = [];
let pipedLoaded = false;
async function ask(label) {
  if (!process.stdin.isTTY) {
    if (!pipedLoaded) { pipedLoaded = true; let d = ""; for await (const c of process.stdin) d += c; piped.push(...d.split(/\r?\n/)); }
    return piped.shift() ?? "";
  }
  process.stdout.write(label);
  return new Promise((resolve) => {
    let s = "";
    process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding("utf8");
    const on = (ch) => {
      for (const c of ch) {
        if (c === "\u0003") { process.stdout.write("\n"); process.exit(130); }
        if (c === "\r" || c === "\n") { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("data", on); process.stdout.write("\n"); return resolve(s); }
        if (c === "\u007f" || c === "\b") s = s.slice(0, -1); else s += c;
      }
    };
    process.stdin.on("data", on);
  });
}

console.log(`Repositorio: ${owner}/${repo} (rama ${branch})\n`);
const password = await ask("Contraseña del panel (no se muestra ni se guarda): ");
if (password.length < MIN_PASSWORD_LENGTH) die(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres (usa un gestor de contraseñas y una aleatoria larga).`);
const again = await ask("Repítela: ");
if (again !== password) die("Las contraseñas no coinciden.");
const token = (await ask("Token de GitHub (fine-grained, solo este repo, Contents: Read and write): ")).trim();
if (!/^(github_pat_|ghp_)/.test(token)) die("Eso no parece un token de GitHub (empieza por github_pat_ o ghp_).");

if (!args.includes("--no-check")) {
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }).catch((e) => die("Sin conexión con GitHub: " + e.message));
  if (r.status === 404 || r.status === 401) die(`El token no tiene acceso a ${owner}/${repo} (HTTP ${r.status}). Revisa el repositorio seleccionado al crear el token.`);
  const j = await r.json();
  if (j.permissions && !j.permissions.push) die("El token solo puede LEER el repositorio: necesita Contents: Read and write.");
  console.log("✓ El token tiene acceso de escritura al repositorio.");
}

const vault = await encryptVault({ token, owner, repo, branch }, password);
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/admin-vault.json", JSON.stringify(vault) + "\n");
console.log("\n✓ Escrito public/admin-vault.json (token cifrado con AES-256-GCM, PBKDF2 600 000 iteraciones).");
console.log("  Súbelo con git. La contraseña NO está en ningún fichero: guárdala en tu gestor de contraseñas.");
console.log("  Si la pierdes: borra el archivo y vuelve a ejecutar este comando con una nueva.");
