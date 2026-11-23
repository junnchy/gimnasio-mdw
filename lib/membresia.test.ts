// Regla crítica del ADR 0002: quién gana cuando una membresía cancelada
// además ya venció, y cuándo se muestra VENCIDA.
import { describe, it, expect } from "vitest";
import { calcularFechaFin, estadoMembresiaVista, membresiaHabilita, puedeAsignarPlan } from "./membresia";

describe("estadoMembresiaVista (ADR 0002)", () => {
  const base = { estado: "ACTIVA" as const, fechaFin: new Date("2026-03-01") };

  it("ACTIVA mientras fechaFin es futura", () => {
    expect(estadoMembresiaVista(base, new Date("2026-01-01"))).toBe("ACTIVA");
  });

  it("VENCIDA cuando fechaFin ya pasó", () => {
    expect(estadoMembresiaVista(base, new Date("2026-06-01"))).toBe("VENCIDA");
  });

  it("CANCELADA gana aunque fechaFin ya pasó (cancelar es un acto)", () => {
    expect(
      estadoMembresiaVista(
        { estado: "CANCELADA", fechaFin: new Date("2026-02-01") },
        new Date("2026-06-01"),
      ),
    ).toBe("CANCELADA");
  });

  it("borde: el instante exacto del vencimiento todavía es ACTIVA", () => {
    expect(estadoMembresiaVista(base, new Date("2026-03-01"))).toBe("ACTIVA");
  });
});

describe("membresiaHabilita (spec §6)", () => {
  it("solo habilita con ACTIVA", () => {
    expect(membresiaHabilita("ACTIVA")).toBe(true);
    expect(membresiaHabilita("VENCIDA")).toBe(false);
    expect(membresiaHabilita("CANCELADA")).toBe(false);
  });

  it("un socio sin ninguna membresía no está habilitado", () => {
    expect(membresiaHabilita(null)).toBe(false);
  });
});

describe("calcularFechaFin", () => {
  it("cuenta la duración del plan desde el día de inicio", () => {
    expect(calcularFechaFin(new Date("2026-12-01T03:00:00.000Z"), 30)).toEqual(new Date("2026-12-31T03:00:00.000Z"));
  });

  it("un plan anual cruza el año sin perder días", () => {
    expect(calcularFechaFin(new Date("2026-12-01T03:00:00.000Z"), 365)).toEqual(new Date("2027-12-01T03:00:00.000Z"));
  });
});

describe("puedeAsignarPlan", () => {
  it.each([
    [null, true],
    ["CANCELADA", true],
    ["ACTIVA", false],
    ["VENCIDA", false],
  ] as const)("con la membresía %s → %s", (estado, esperado) => {
    expect(puedeAsignarPlan(estado)).toBe(esperado);
  });
});
