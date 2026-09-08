// Regla del ADR 0003: la duración sale de restar los dos hechos, nunca se
// guarda. Si se rompe este cálculo, el egreso del QR (H2) muestra minutos mal.
import { describe, it, expect } from "vitest";
import { calcularDuracionMin } from "./visita";
import { inicioDelDiaArgentina } from "./db/visitas";

describe("calcularDuracionMin (ADR 0003)", () => {
  it("calcula la duración en minutos redondeada", () => {
    const ingreso = new Date("2026-03-01T10:00:00Z");
    const egreso = new Date("2026-03-01T11:30:00Z");
    expect(calcularDuracionMin(ingreso, egreso)).toBe(90);
  });

  it("una visita de menos de un minuto redondea a 0", () => {
    const ingreso = new Date("2026-03-01T10:00:00Z");
    const egreso = new Date("2026-03-01T10:00:20Z");
    expect(calcularDuracionMin(ingreso, egreso)).toBe(0);
  });
});

describe("inicioDelDiaArgentina", () => {
  it("usa el día local argentino aunque el servidor esté en UTC", () => {
    const ahora = new Date("2026-09-08T00:30:00Z");
    expect(inicioDelDiaArgentina(ahora).toISOString()).toBe("2026-09-07T03:00:00.000Z");
  });
});
