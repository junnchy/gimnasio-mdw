import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const { transaccion } = vi.hoisted(() => ({ transaccion: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ prisma: { $transaction: transaccion } }));
import { operarSocio, OperacionConcurrente } from "./operacionSocio";

const conflicto = () => new Prisma.PrismaClientKnownRequestError("serialization", { code: "P2034", clientVersion: "6" });
beforeEach(() => vi.resetAllMocks());

describe("transacción serializable", () => {
  it("reintenta con un callback nuevo para releer todos los datos", async () => {
    transaccion.mockRejectedValueOnce(conflicto()).mockResolvedValueOnce("guardado");
    expect(await operarSocio("socio", async () => "guardado")).toBe("guardado");
    expect(transaccion).toHaveBeenCalledTimes(2);
    expect(transaccion.mock.calls[0]![0]).not.toBe(transaccion.mock.calls[1]![0]);
    expect(transaccion.mock.calls[0]![1]).toEqual({ isolationLevel: "Serializable", maxWait: 10000, timeout: 15000 });
  });
  it("corta después de tres intentos", async () => {
    transaccion.mockRejectedValue(conflicto());
    await expect(operarSocio("socio", async () => "guardado")).rejects.toBeInstanceOf(OperacionConcurrente);
    expect(transaccion).toHaveBeenCalledTimes(3);
  });
  it("reintenta P2028 únicamente si la transacción no llegó a iniciar", async () => {
    const noInicio = new Prisma.PrismaClientKnownRequestError("Unable to start a transaction in the given time", { code: "P2028", clientVersion: "6" });
    transaccion.mockRejectedValueOnce(noInicio).mockResolvedValueOnce("guardado");
    expect(await operarSocio("socio", async () => "guardado")).toBe("guardado");
    expect(transaccion).toHaveBeenCalledTimes(2);
  });
  it("no reintenta un P2028 con resultado incierto", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Transaction already closed", { code: "P2028", clientVersion: "6" });
    transaccion.mockRejectedValue(error);
    await expect(operarSocio("socio", async () => "guardado")).rejects.toBe(error);
    expect(transaccion).toHaveBeenCalledTimes(1);
  });
  it("no reintenta errores ajenos a la serialización", async () => {
    const error = new Error("conexion"); transaccion.mockRejectedValue(error);
    await expect(operarSocio("socio", async () => "guardado")).rejects.toBe(error);
    expect(transaccion).toHaveBeenCalledTimes(1);
  });
});
