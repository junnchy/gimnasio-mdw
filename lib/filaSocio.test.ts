import { describe, expect, it } from "vitest";
import { aFilaSocio, filtrarSocios } from "./filaSocio";

const ahora = new Date("2026-11-10T15:00:00Z");
const socio = (membresias: { estado: "ACTIVA" | "CANCELADA"; fechaFin: Date }[], id = "s1") => ({
  id,
  nombre: "Tomás Fernández",
  email: "tomas.fernandez@ejemplo.com",
  membresias: membresias.map((m) => ({ ...m, plan: { nombre: "Mensual" } })),
  visitas: [{ ingresoAt: new Date("2026-11-09T21:00:00Z") }],
});

describe("aFilaSocio", () => {
  it("activa: plan y 'Vence el', en la fecha del gimnasio", () => {
    const fila = aFilaSocio(socio([{ estado: "ACTIVA", fechaFin: new Date("2026-12-01T12:00:00Z") }]), ahora);
    expect(fila.estado).toBe("ACTIVA");
    expect(fila.plan).toBe("Mensual");
    expect(fila.vencimiento).toBe("Vence el martes, 1 de diciembre");
    expect(fila.ultimaVisita).toBe("lunes, 9 de noviembre");
  });

  it("VENCIDA se calcula al leer: ACTIVA en la base con fechaFin pasada (ADR 0002)", () => {
    const fila = aFilaSocio(socio([{ estado: "ACTIVA", fechaFin: new Date("2026-11-01T12:00:00Z") }]), ahora);
    expect(fila.estado).toBe("VENCIDA");
    expect(fila.vencimiento).toMatch(/^Venció el/);
  });

  it("CANCELADA no habla de vencimiento: cancelar es un hecho, no el paso del tiempo", () => {
    const fila = aFilaSocio(socio([{ estado: "CANCELADA", fechaFin: new Date("2026-11-01T12:00:00Z") }]), ahora);
    expect(fila.estado).toBe("CANCELADA");
    expect(fila.vencimiento).toBe("Cancelada");
  });

  it("sin membresía: estado null y sin vencimiento", () => {
    const fila = aFilaSocio({ ...socio([]), visitas: [] }, ahora);
    expect(fila.estado).toBeNull();
    expect(fila.vencimiento).toBeNull();
    expect(fila.ultimaVisita).toBeNull();
  });
});

describe("filtrarSocios", () => {
  const filas = [
    aFilaSocio(socio([{ estado: "ACTIVA", fechaFin: new Date("2026-12-01T12:00:00Z") }], "activa"), ahora),
    aFilaSocio(socio([{ estado: "ACTIVA", fechaFin: new Date("2026-11-01T12:00:00Z") }], "vencida"), ahora),
    aFilaSocio(socio([{ estado: "CANCELADA", fechaFin: new Date("2026-12-01T12:00:00Z") }], "cancelada"), ahora),
    aFilaSocio(socio([], "nunca"), ahora),
  ];
  const ids = (f: Parameters<typeof filtrarSocios>[1]) => filtrarSocios(filas, f).map((x) => x.id);

  it("cada filtro deja lo suyo", () => {
    expect(ids("TODOS")).toEqual(["activa", "vencida", "cancelada", "nunca"]);
    expect(ids("ACTIVAS")).toEqual(["activa"]);
    expect(ids("VENCIDAS")).toEqual(["vencida"]);
    expect(ids("SIN_MEMBRESIA")).toEqual(["cancelada", "nunca"]);
  });
});
