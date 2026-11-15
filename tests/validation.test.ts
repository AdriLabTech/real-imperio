import { describe, expect, it } from "vitest";
import { clean, validateMatchRequest } from "../src/lib/validation";
import { buildMessage, whatsappUrl } from "../src/lib/whatsapp";
import { club } from "../src/config/club";
import { madridToISO, parsePlayerKey } from "../src/lib/content";

const future = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
const base = { teamName: "Club Test", proposedDate: future };

describe("clean", () => {
  it("quita etiquetas, caracteres de control y espacios", () => {
    expect(clean("  <script>alert(1)</script>Hola\u0000   mundo​ ")).toBe("alert(1)Hola mundo");
  });
});

describe("validateMatchRequest", () => {
  it("acepta solo los campos obligatorios", () => {
    const r = validateMatchRequest(base);
    expect(r.ok).toBe(true);
  });
  it("exige equipo y fecha", () => {
    const r = validateMatchRequest({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors)).toEqual(expect.arrayContaining(["teamName", "proposedDate"]));
  });
  it("rechaza fechas pasadas y formatos erróneos", () => {
    expect(validateMatchRequest({ ...base, proposedDate: "2020-01-01" }).ok).toBe(false);
    expect(validateMatchRequest({ ...base, proposedDate: "mañana" }).ok).toBe(false);
  });
  it("valida correo y teléfono solo si se rellenan", () => {
    expect(validateMatchRequest({ ...base, email: "", phone: "" }).ok).toBe(true);
    expect(validateMatchRequest({ ...base, email: "x@" }).ok).toBe(false);
    expect(validateMatchRequest({ ...base, phone: "abc" }).ok).toBe(false);
    expect(validateMatchRequest({ ...base, phone: "+34 600 000 000" }).ok).toBe(true);
  });
  it("limita la longitud de comentarios", () => {
    expect(validateMatchRequest({ ...base, comments: "x".repeat(1001) }).ok).toBe(false);
  });
  it("sanea el nombre del equipo", () => {
    const r = validateMatchRequest({ ...base, teamName: "A <b>B</b> FC" });
    expect(r.ok && r.data.teamName).toBe("A B FC");
  });
});

describe("WhatsApp", () => {
  it("compone el mensaje solo con los campos rellenados", () => {
    const r = validateMatchRequest({ ...base, city: "Sevilla", matchType: "torneo" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const m = buildMessage(r.data);
      expect(m).toContain("*Equipo:* Club Test");
      expect(m).toContain("*Localidad:* Sevilla");
      expect(m).toContain("*Tipo de partido:* Torneo");
      expect(m).not.toContain("Correo");
      expect(whatsappUrl(r.data).startsWith(`https://wa.me/${club.whatsapp.number}?text=`)).toBe(true);
    }
  });
});

describe("contenido", () => {
  it("interpreta Nombre_Apellidos_Posicion", () => {
    expect(parsePlayerKey("Juan_Perez_Garcia_Delantero")).toEqual({ name: "Juan Perez Garcia", positionLabel: "Delantero", position: "DEL" });
    expect(parsePlayerKey("Ana_Lopez_Lateral").position).toBe("DEF");
    expect(parsePlayerKey("Luis_Gómez_Mediapunta").position).toBe("MED");
  });
  it("rechaza nombres sin posición válida con un mensaje claro", () => {
    expect(() => parsePlayerKey("Juan_Perez")).toThrow(/Nombre_Apellidos_Posicion/);
    expect(() => parsePlayerKey("Juan_Perez_Entrenador")).toThrow(/posición/);
  });
  it("convierte hora de Madrid a UTC con horario de verano e invierno", () => {
    expect(madridToISO("2026-12-05 18:30")).toBe("2026-12-05T17:30:00.000Z");
    expect(madridToISO("2026-07-05 18:30")).toBe("2026-07-05T16:30:00.000Z");
  });
});
