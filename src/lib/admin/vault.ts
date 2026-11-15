/**
 * «Bóveda» del panel de administración.
 * La contraseña NUNCA se guarda: solo deriva (PBKDF2) la clave AES-GCM que cifra el token de GitHub.
 * Lo único que se publica es el JSON cifrado. Sin dependencias: lo usan el navegador y scripts/admin-sellar.mjs.
 */
export interface VaultFile { v: 1; kdf: "PBKDF2-SHA256"; iter: number; salt: string; iv: string; ct: string }
export interface VaultPayload { token: string; owner: string; repo: string; branch: string }

export const VAULT_ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 16;
const AAD = new TextEncoder().encode("real-imperio-admin-vault-v1");

const toB64 = (u: Uint8Array) => { let s = ""; for (const b of u) s += String.fromCharCode(b); return btoa(s); };
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array, iter: number) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: iter }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encryptVault(payload: VaultPayload, password: string, iter = VAULT_ITERATIONS): Promise<VaultFile> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iter);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource, additionalData: AAD as BufferSource }, key, new TextEncoder().encode(JSON.stringify(payload)));
  return { v: 1, kdf: "PBKDF2-SHA256", iter, salt: toB64(salt), iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
}

/** Lanza «Contraseña incorrecta» si la clave no descifra (AES-GCM autentica: no hay falsos positivos). */
export async function decryptVault(file: VaultFile, password: string): Promise<VaultPayload> {
  if (file.v !== 1 || file.kdf !== "PBKDF2-SHA256") throw new Error("Formato de bóveda no reconocido.");
  try {
    const key = await deriveKey(password, fromB64(file.salt), file.iter);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(file.iv) as BufferSource, additionalData: AAD as BufferSource }, key, fromB64(file.ct) as BufferSource);
    return JSON.parse(new TextDecoder().decode(pt)) as VaultPayload;
  } catch {
    throw new Error("Contraseña incorrecta.");
  }
}
