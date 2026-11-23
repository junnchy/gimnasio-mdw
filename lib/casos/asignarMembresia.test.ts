import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ obtenerPlan: vi.fn(), crearMembresia: vi.fn() }));
vi.mock("@/lib/db/planes", () => ({ obtenerPlan: mocks.obtenerPlan }));
vi.mock("@/lib/db/membresias", () => ({ crearMembresia: mocks.crearMembresia }));

import { asignarMembresia } from "./asignarMembresia";

// El cálculo de la fecha tiene su prueba como función pura (lib/membresia.test.ts).
// Acá, lo que hace el caso de uso con la base: qué le pide y qué devuelve.
const fechaInicio = new Date("2026-12-01T03:00:00.000Z");
const duplicado = () => new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "test" });

beforeEach(() => vi.resetAllMocks());

describe("asignarMembresia", () => {
  it("desde la pantalla: la fechaFin sale de la duración del plan", async () => {
    mocks.obtenerPlan.mockResolvedValue({ id: "plan-1", duracionDias: 30 });
    mocks.crearMembresia.mockImplementation(async (datos) => ({ id: "m1", ...datos }));
    const resultado = await asignarMembresia({ socioId: "s1", planId: "plan-1", fechaInicio });
    expect(mocks.crearMembresia).toHaveBeenCalledWith(expect.objectContaining({ fechaFin: new Date("2026-12-31T03:00:00.000Z") }));
    expect(resultado).toMatchObject({ ok: true, dato: { id: "m1" } });
  });

  it("desde la API: respeta la fechaFin del contrato y no busca el plan", async () => {
    const fechaFin = new Date("2027-03-01T03:00:00.000Z");
    mocks.crearMembresia.mockImplementation(async (datos) => ({ id: "m1", ...datos }));
    await asignarMembresia({ socioId: "s1", planId: "plan-1", fechaInicio, fechaFin });
    expect(mocks.obtenerPlan).not.toHaveBeenCalled();
    expect(mocks.crearMembresia).toHaveBeenCalledWith(expect.objectContaining({ fechaFin }));
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

  it("si la base rechaza una segunda ACTIVA (índice único), es un rechazo de negocio, no un error", async () => {
    mocks.obtenerPlan.mockResolvedValue({ id: "plan-1", duracionDias: 30 });
    mocks.crearMembresia.mockRejectedValue(duplicado());
    expect(await asignarMembresia({ socioId: "s1", planId: "plan-1", fechaInicio })).toMatchObject({
      ok: false, tipo: "CONFLICTO", motivos: [{ codigo: "MEMBRESIA_ACTIVA_DUPLICADA", mensaje: expect.stringContaining("ya tiene una membresía activa") }],
    });
  });

  it("cualquier otro error de la base sigue de largo", async () => {
    mocks.obtenerPlan.mockResolvedValue({ id: "plan-1", duracionDias: 30 });
    mocks.crearMembresia.mockRejectedValue(new Error("se cayó la conexión"));
    await expect(asignarMembresia({ socioId: "s1", planId: "plan-1", fechaInicio })).rejects.toThrow("se cayó la conexión");
  });
});
