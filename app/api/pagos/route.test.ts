// Clase 7 — que Mercado Pago falle nunca impide que el pago quede registrado
// (spec §8), y el EFECTIVO no sale a Mercado Pago.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requerirUsuario, obtenerMembresiaParaPago, registrarPago, crearPreferenciaDePago } = vi.hoisted(() => ({
  requerirUsuario: vi.fn(),
  obtenerMembresiaParaPago: vi.fn(),
  registrarPago: vi.fn(),
  crearPreferenciaDePago: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirUsuario }));
vi.mock("@/lib/db/membresias", () => ({ obtenerMembresiaParaPago }));
vi.mock("@/lib/db/pagos", () => ({ registrarPago }));
vi.mock("@/lib/servicios/mercadoPago", () => ({ crearPreferenciaDePago }));

import { POST } from "./route";

const ID_MEMBRESIA = "ckmembresia000000000000001";
const ID_PAGO = "ckpago00000000000000000001";
const admin = { id: "admin-1", email: "a@gmail.com", nombre: "Admin", rol: "ADMIN" };
const fechaFin = new Date("2026-10-30T00:00:00.000Z");

const pagar = (medio: "EFECTIVO" | "MP") =>
  POST(
    new Request("http://localhost/api/pagos", {
      method: "POST",
      body: JSON.stringify({ membresiaId: ID_MEMBRESIA, monto: 15000, fecha: "2026-09-30", medio }),
    }),
  );

beforeEach(() => {
  vi.resetAllMocks();
  requerirUsuario.mockResolvedValue(admin);
  obtenerMembresiaParaPago.mockResolvedValue({
    id: ID_MEMBRESIA, estado: "ACTIVA", fechaFin, plan: { duracionDias: 30 },
  });
});

describe("POST /api/pagos", () => {
  it("EFECTIVO → 201 y no llama a Mercado Pago", async () => {
    registrarPago.mockResolvedValueOnce({
      pago: { id: ID_PAGO, medio: "EFECTIVO", estado: "APROBADO" }, renovada: true, fechaFin,
    });

    const respuesta = await pagar("EFECTIVO");

    expect(respuesta.status).toBe(201);
    expect(crearPreferenciaDePago).not.toHaveBeenCalled();
    expect((await respuesta.json()).checkoutUrl).toBeNull();
  });

  it("MP con Mercado Pago andando → 201 con el link de pago", async () => {
    registrarPago.mockResolvedValueOnce({
      pago: { id: ID_PAGO, medio: "MP", estado: "PENDIENTE" }, renovada: false, fechaFin,
    });
    crearPreferenciaDePago.mockResolvedValueOnce({ id: "pref-1", init_point: "https://mp.test/pref-1" });

    const respuesta = await pagar("MP");

    expect(respuesta.status).toBe(201);
    expect(crearPreferenciaDePago).toHaveBeenCalledWith({ id: ID_PAGO, monto: 15000 });
    expect((await respuesta.json()).checkoutUrl).toBe("https://mp.test/pref-1");
  });

  it("MP con Mercado Pago caído → igual 201: el pago ya quedó registrado", async () => {
    registrarPago.mockResolvedValueOnce({
      pago: { id: ID_PAGO, medio: "MP", estado: "PENDIENTE" }, renovada: false, fechaFin,
    });
    crearPreferenciaDePago.mockResolvedValueOnce(null);

    const respuesta = await pagar("MP");

    expect(respuesta.status).toBe(201);
    expect(registrarPago).toHaveBeenCalledOnce();
    const body = await respuesta.json();
    expect(body.pago).toMatchObject({ id: ID_PAGO, estado: "PENDIENTE" });
    expect(body.checkoutUrl).toBeNull();
  });

  it("a Mercado Pago se lo llama después de registrar el pago, nunca antes", async () => {
    const orden: string[] = [];
    registrarPago.mockImplementationOnce(async () => {
      orden.push("registrarPago");
      return { pago: { id: ID_PAGO, medio: "MP", estado: "PENDIENTE" }, renovada: false, fechaFin };
    });
    crearPreferenciaDePago.mockImplementationOnce(async () => {
      orden.push("crearPreferenciaDePago");
      return null;
    });

    await pagar("MP");

    expect(orden).toEqual(["registrarPago", "crearPreferenciaDePago"]);
  });
});
