import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ obtenerPlan: vi.fn(), crearMembresia: vi.fn() }));
vi.mock("@/lib/db/planes", () => ({ obtenerPlan: mocks.obtenerPlan }));
vi.mock("@/lib/db/membresias", () => ({ crearMembresia: mocks.crearMembresia }));

import { asignarMembresia } from "./asignarMembresia";

const fechaInicio = new Date("2026-12-01T03:00:00.000Z");

beforeEach(() => vi.resetAllMocks());

describe("asignarMembresia", () => {
  it("la membresía cubre la duración del plan desde el día de inicio", async () => {
    mocks.obtenerPlan.mockResolvedValue({ id: "plan-1", duracionDias: 30 });
    mocks.crearMembresia.mockImplementation(async (datos) => ({ id: "m1", ...datos }));
    const resultado = await asignarMembresia({ socioId: "s1", planId: "plan-1", fechaInicio });
    expect(mocks.crearMembresia).toHaveBeenCalledWith({ socioId: "s1", planId: "plan-1", fechaInicio, fechaFin: new Date("2026-12-31T03:00:00.000Z") });
    expect(resultado).toEqual({ ok: true, dato: { id: "m1", fechaFin: new Date("2026-12-31T03:00:00.000Z") } });
  });

  it("un plan que no existe no crea nada", async () => {
    mocks.obtenerPlan.mockResolvedValue(null);
    expect(await asignarMembresia({ socioId: "s1", planId: "nada", fechaInicio })).toMatchObject({ ok: false, tipo: "NO_ENCONTRADO" });
    expect(mocks.crearMembresia).not.toHaveBeenCalled();
  });

  it("un id que no es de un socio responde NO_ENCONTRADO", async () => {
    mocks.obtenerPlan.mockResolvedValue({ id: "plan-1", duracionDias: 30 });
    mocks.crearMembresia.mockResolvedValue(null);
    expect(await asignarMembresia({ socioId: "profesor-1", planId: "plan-1", fechaInicio })).toMatchObject({ ok: false, tipo: "NO_ENCONTRADO" });
  });
});
