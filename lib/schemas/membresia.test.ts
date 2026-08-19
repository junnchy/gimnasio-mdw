// Test mínimo de las reglas críticas de los schemas.
// NOTA: alineá la primera línea de import con el runner del repo (mirá `nota.test.ts`).
// - Vitest:  import { describe, it, expect } from "vitest";
// - Jest:    (usa globals, podés borrar el import)
// - node:test: import { test } from "node:test"; import assert from "node:assert";
import { describe, it, expect } from "vitest";
import { membresiaSchema } from "./membresia";
import { registrarEscaneoSchema } from "./escaneo";
import { reservaSchema } from "./reserva";
import { estadoVisita } from "./_common";

describe("membresiaSchema", () => {
  it("rechaza fechaFin anterior a fechaInicio", () => {
    const r = membresiaSchema.safeParse({
      socioId: "s1",
      planId: "p1",
      fechaInicio: "2026-01-10",
      fechaFin: "2026-01-05",
    });
    expect(r.success).toBe(false);
  });

  it("acepta un rango de fechas válido", () => {
    const r = membresiaSchema.safeParse({
      socioId: "s1",
      planId: "p1",
      fechaInicio: "2026-01-01",
      fechaFin: "2026-02-01",
    });
    expect(r.success).toBe(true);
  });
});

describe("reservaSchema", () => {
  it("presente arranca en false por defecto", () => {
    const r = reservaSchema.parse({
      socioId: "s1",
      claseId: "c1",
      fecha: "2026-03-01",
    });
    expect(r.presente).toBe(false);
  });
});

describe("registrarEscaneoSchema", () => {
  it("rechaza un qrToken demasiado corto", () => {
    const r = registrarEscaneoSchema.safeParse({ socioId: "s1", qrToken: "abc" });
    expect(r.success).toBe(false);
  });
});

describe("estadoVisita", () => {
  it("rechaza un estado inválido", () => {
    expect(estadoVisita.safeParse("PAUSADA").success).toBe(false);
  });
});
