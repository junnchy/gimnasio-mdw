import { describe, expect, it } from "vitest";
import { aFilaVisita, formatearDuracion } from "./filaVisita";

const socio = { nombre: "Valentina Pérez", email: "valentina.perez@ejemplo.com" };
const ingresoAt = new Date("2026-11-10T21:00:00Z"); // 18:00 en Argentina

describe("formatearDuracion", () => {
  it("minutos, horas justas y horas con minutos", () => {
    expect(formatearDuracion(45)).toBe("45 min");
    expect(formatearDuracion(60)).toBe("1 h");
    expect(formatearDuracion(65)).toBe("1 h 05 min");
  });
});

describe("aFilaVisita", () => {
  it("una visita CERRADA muestra la duración calculada, en la hora del gimnasio", () => {
    const fila = aFilaVisita(
      { id: "v1", ingresoAt, egresoAt: new Date("2026-11-10T22:15:00Z"), estado: "CERRADA", socio },
      new Date("2026-11-11T00:00:00Z"),
    );
    expect(fila.ingreso).toBe("18:00");
    expect(fila.egreso).toBe("19:15");
    expect(fila.tiempo).toBe("1 h 15 min");
    expect(fila.fecha).toBe("martes, 10 de noviembre");
  });

  it("una ABIERTA muestra cuánto lleva adentro, contado hasta `ahora`", () => {
    const fila = aFilaVisita({ id: "v2", ingresoAt, egresoAt: null, estado: "ABIERTA", socio }, new Date("2026-11-10T21:40:00Z"));
    expect(fila.egreso).toBeNull();
    expect(fila.tiempo).toBe("40 min");
  });

  it("una INCOMPLETA no inventa duración (ADR 0003)", () => {
    const fila = aFilaVisita({ id: "v3", ingresoAt, egresoAt: null, estado: "INCOMPLETA", socio }, new Date("2026-11-11T12:00:00Z"));
    expect(fila.tiempo).toBeNull();
  });
});
