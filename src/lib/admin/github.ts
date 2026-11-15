import type { VaultPayload } from "./vault";

export interface DirEntry { name: string; path: string; sha: string; size: number }
/** Operación sobre un fichero dentro de un único commit. */
export type Op =
  | { path: string; text: string }            // escribir texto UTF-8
  | { path: string; base64: string }          // escribir binario (imágenes, vídeos)
  | { path: string; moveFromSha: string }     // colocar un blob ya existente en otra ruta (renombrar/mover)
  | { path: string; delete: true };

export class GitHubError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

const API = "https://api.github.com";

/** Cliente mínimo de la API de GitHub (contenidos + Git Data para commits atómicos). */
export class GitHub {
  constructor(private p: VaultPayload) {}
  get label() { return `${this.p.owner}/${this.p.repo}@${this.p.branch}`; }
  get actionsUrl() { return `https://github.com/${this.p.owner}/${this.p.repo}/actions`; }

  private async req(path: string, init: RequestInit = {}, accept = "application/vnd.github+json"): Promise<Response> {
    const r = await fetch(`${API}/repos/${this.p.owner}/${this.p.repo}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.p.token}`, Accept: accept, "X-GitHub-Api-Version": "2022-11-28", ...(init.body ? { "Content-Type": "application/json" } : {}) },
    });
    if (!r.ok && r.status !== 404) {
      const detail = await r.json().then((j) => j.message as string).catch(() => r.statusText);
      const hint = r.status === 401 ? "El token ha caducado o es inválido: vuelve a sellarlo con npm run admin:sellar." : r.status === 403 ? "Sin permiso (¿el token tiene Contents: Read and write?) o límite de la API." : detail;
      throw new GitHubError(r.status, `GitHub ${r.status}: ${hint}`);
    }
    return r;
  }
  private async json<T>(path: string, init?: RequestInit): Promise<T> { return (await this.req(path, init)).json(); }

  async check() { await this.json(`/branches/${encodeURIComponent(this.p.branch)}`); }

  /** Texto de un fichero o null si no existe. */
  async readText(path: string): Promise<string | null> {
    const r = await this.req(`/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(this.p.branch)}`, {}, "application/vnd.github.raw+json");
    return r.status === 404 ? null : r.text();
  }
  async list(dir: string): Promise<DirEntry[]> {
    const r = await this.req(`/contents/${dir}?ref=${encodeURIComponent(this.p.branch)}`);
    if (r.status === 404) return [];
    const j = await r.json();
    return (Array.isArray(j) ? j : []).filter((e: { type: string }) => e.type === "file").map((e: DirEntry) => ({ name: e.name, path: e.path, sha: e.sha, size: e.size }));
  }
  /** Descarga un blob (para miniaturas) y devuelve una URL local. */
  async blobUrl(sha: string, type = "image/jpeg"): Promise<string> {
    const r = await this.req(`/git/blobs/${sha}`, {}, "application/vnd.github.raw+json");
    return URL.createObjectURL(new Blob([await r.arrayBuffer()], { type }));
  }

  /** Un solo commit con todas las operaciones (un único despliegue). Devuelve el SHA del commit. */
  async commit(message: string, ops: Op[]): Promise<string> {
    if (!ops.length) throw new Error("No hay cambios que publicar.");
    const ref = await this.json<{ object: { sha: string } }>(`/git/ref/heads/${encodeURIComponent(this.p.branch)}`);
    const parent = ref.object.sha;
    const base = await this.json<{ tree: { sha: string } }>(`/git/commits/${parent}`);
    const tree: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
    for (const op of ops) {
      if ("delete" in op) tree.push({ path: op.path, mode: "100644", type: "blob", sha: null });
      else if ("moveFromSha" in op) tree.push({ path: op.path, mode: "100644", type: "blob", sha: op.moveFromSha });
      else {
        const body = "text" in op ? { content: op.text, encoding: "utf-8" } : { content: op.base64, encoding: "base64" };
        const blob = await this.json<{ sha: string }>("/git/blobs", { method: "POST", body: JSON.stringify(body) });
        tree.push({ path: op.path, mode: "100644", type: "blob", sha: blob.sha });
      }
    }
    const t = await this.json<{ sha: string }>("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
    const c = await this.json<{ sha: string }>("/git/commits", { method: "POST", body: JSON.stringify({ message, tree: t.sha, parents: [parent] }) });
    await this.json(`/git/refs/heads/${encodeURIComponent(this.p.branch)}`, { method: "PATCH", body: JSON.stringify({ sha: c.sha }) });
    return c.sha;
  }
}
