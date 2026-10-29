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
    expect(transaccion.mock.calls[0]![1]).toEqual({ isolationLevel: "Serializable" });
  });
  it("corta después de tres intentos", async () => {
    transaccion.mockRejectedValue(conflicto());
    await expect(operarSocio("socio", async () => "guardado")).rejects.toBeInstanceOf(OperacionConcurrente);
    expect(transaccion).toHaveBeenCalledTimes(3);
  });
  it("no reintenta errores ajenos a la serialización", async () => {
    const error = new Error("conexion"); transaccion.mockRejectedValue(error);
    await expect(operarSocio("socio", async () => "guardado")).rejects.toBe(error);
    expect(transaccion).toHaveBeenCalledTimes(1);
  });
});
