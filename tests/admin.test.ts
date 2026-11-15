import { describe, expect, it } from "vitest";
import { decryptVault, encryptVault } from "../src/lib/admin/vault";
import { galleryFrom, galleryOps, matchesFrom, matchOps, playerKey, playerOps, playersFrom, validateMatches, validatePlayers } from "../src/lib/admin/model";

const payload = { token: "github_pat_FAKE", owner: "o", repo: "r", branch: "main" };
const PW = "una-clave-de-prueba-muy-larga-123"; // solo para tests; NO es la contraseña real

describe("bóveda", () => {
  it("cifra y descifra con la contraseña correcta", async () => {
    const v = await encryptVault(payload, PW, 1000);
    expect(await decryptVault(v, PW)).toEqual(payload);
  });
  it("no contiene el token ni la contraseña en claro", async () => {
    const v = JSON.stringify(await encryptVault(payload, PW, 1000));
    expect(v).not.toContain("FAKE"); expect(v).not.toContain(PW);
  });
  it("rechaza una contraseña incorrecta", async () => {
    const v = await encryptVault(payload, PW, 1000);
    await expect(decryptVault(v, PW + "x")).rejects.toThrow("Contraseña incorrecta");
  });
  it("detecta manipulación del texto cifrado", async () => {
    const v = await encryptVault(payload, PW, 1000);
    const bad = { ...v, ct: (v.ct[0] === "A" ? "B" : "A") + v.ct.slice(1) };
    await expect(decryptVault(bad, PW)).rejects.toThrow();
  });
  it("cada sellado usa sal e IV distintos", async () => {
    const a = await encryptVault(payload, PW, 1000), b = await encryptVault(payload, PW, 1000);
    expect(a.salt).not.toBe(b.salt); expect(a.ct).not.toBe(b.ct);
  });
});

const files = [{ name: "Juan_Perez_Delantero.jpg", path: "public/jugadores/Juan_Perez_Delantero.jpg", sha: "sha1", size: 10 }];
const pjson = { Juan_Perez_Delantero: { dorsal: 9, bio: "Hola" }, Sin_Foto_Portero: {} };
const pText = JSON.stringify(pjson, null, 2) + "\n";

describe("jugadores", () => {
  it("clave de archivo con nombre y posición", () => expect(playerKey("Juan Pérez  García", "Delantero")).toBe("Juan_Pérez_García_Delantero"));
  it("carga fotos y jugadores solo-JSON", () => {
    const l = playersFrom(files, pjson);
    expect(l.map((p) => p.nombre).sort()).toEqual(["Juan Perez", "Sin Foto"]);
    expect(l.find((p) => p.nombre === "Juan Perez")?.photo?.sha).toBe("sha1");
  });
  it("sin cambios no genera operaciones", () => {
    const l = playersFrom(files, pjson);
    expect(playerOps(l, structuredClone(l), pText)).toEqual([]);
  });
  it("renombrar mueve la foto (mismo blob) y reescribe el JSON", () => {
    const l = playersFrom(files, pjson); const cur = structuredClone(l);
    cur.find((p) => p.nombre === "Juan Perez")!.nombre = "Juan Pérez";
    const ops = playerOps(l, cur, pText);
    expect(ops).toContainEqual({ path: "public/jugadores/Juan_Pérez_Delantero.jpg", moveFromSha: "sha1" });
    expect(ops).toContainEqual({ path: "public/jugadores/Juan_Perez_Delantero.jpg", delete: true });
    expect(ops.some((o) => o.path === "content/jugadores.json")).toBe(true);
  });
  it("eliminar borra su foto", () => {
    const l = playersFrom(files, pjson); const cur = l.filter((p) => p.nombre !== "Juan Perez");
    expect(playerOps(l, cur, pText)).toContainEqual({ path: "public/jugadores/Juan_Perez_Delantero.jpg", delete: true });
  });
  it("valida duplicados, posición y dorsal", () => {
    const l = playersFrom(files, pjson); const a = structuredClone(l[0]); a.id = "x";
    expect(validatePlayers([l[0], a]).join()).toMatch(/mismo nombre/);
    expect(validatePlayers([{ ...l[0], dorsal: "123" }]).join()).toMatch(/dorsal/);
    expect(validatePlayers([{ ...l[0], posicion: "Entrenador" }]).join()).toMatch(/posición/);
  });
});

describe("partidos", () => {
  // ordenado por fecha, como lo escribe el panel y `npm run nuevo`
  const rows = [{ fecha: "2026-11-01 12:00", rival: "B", local: false, goles: [2, 0] as [number, number] }, { fecha: "2026-12-05 18:30", rival: "A", local: true }];
  const text = JSON.stringify(rows, null, 2) + "\n";
  it("ida y vuelta sin cambios", () => expect(matchOps(matchesFrom(rows), text)).toEqual([]));
  it("añadir un resultado reescribe partidos.json con goles", () => {
    const l = matchesFrom(rows); l[1].a = "3"; l[1].b = "1";
    const [op] = matchOps(l, text);
    expect(op.path).toBe("content/partidos.json");
    expect("text" in op && JSON.parse(op.text).find((m: { rival: string }) => m.rival === "A").goles).toEqual([3, 1]);
  });
  it("valida marcador a medias y rival vacío", () => {
    const l = matchesFrom(rows); l[1].a = "3"; l[0].rival = "";
    expect(validateMatches(l).join()).toMatch(/los dos marcadores/); expect(validateMatches(l).join()).toMatch(/falta el rival/);
  });
});

describe("galería", () => {
  const byCat = { partidos: [{ name: "a.jpg", path: "public/galeria/partidos/a.jpg", sha: "s", size: 1 }] } as never;
  it("mover de categoría usa el mismo blob", () => {
    const l = galleryFrom(byCat, {}); const cur = structuredClone(l); cur[0].category = "momentos";
    const ops = galleryOps(l, cur, null);
    expect(ops).toContainEqual({ path: "public/galeria/momentos/a.jpg", moveFromSha: "s" });
    expect(ops).toContainEqual({ path: "public/galeria/partidos/a.jpg", delete: true });
  });
  it("subida nueva evita colisiones de nombre", () => {
    const l = galleryFrom(byCat, {}); const cur = structuredClone(l);
    cur.push({ id: "n", kind: "file", category: "partidos", titulo: "", descripcion: "", newFile: { name: "a.jpg", base64: "QQ==", preview: "", video: false } });
    expect(galleryOps(l, cur, null).some((o) => o.path === "public/galeria/partidos/a-2.jpg")).toBe(true);
  });
});
