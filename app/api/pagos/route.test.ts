// Clase 7 — para un pago MP, Mercado Pago es esencial: si falla, 502 y no se
// registra nada (spec §8). El EFECTIVO no sale a Mercado Pago.
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

const pagar = (medio: "EFECTIVO" | "MP", extra: Record<string, unknown> = {}) =>
  POST(
    new Request("http://localhost/api/pagos", {
      method: "POST",
      body: JSON.stringify({ membresiaId: ID_MEMBRESIA, monto: 15000, fecha: "2026-09-30", medio, ...extra }),
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

  it("MP con Mercado Pago andando → 201 con el link, y el pago se registra con el id que viajó a Mercado Pago", async () => {
    crearPreferenciaDePago.mockResolvedValueOnce({ id: "pref-1", init_point: "https://mp.test/pref-1" });
    registrarPago.mockResolvedValueOnce({
      pago: { id: ID_PAGO, medio: "MP", estado: "PENDIENTE" }, renovada: false, fechaFin,
    });

    const respuesta = await pagar("MP");

    expect(respuesta.status).toBe(201);
    expect((await respuesta.json()).checkoutUrl).toBe("https://mp.test/pref-1");
    const idEnviado = crearPreferenciaDePago.mock.calls[0]?.[0].id;
    expect(idEnviado).toEqual(expect.any(String));
    expect(crearPreferenciaDePago).toHaveBeenCalledWith({ id: idEnviado, monto: 15000 });
    expect(registrarPago.mock.calls[0]?.[0]).toMatchObject({ id: idEnviado, medio: "MP" });
  });

  it("MP con Mercado Pago caído → 502 y NO registra nada", async () => {
    crearPreferenciaDePago.mockResolvedValueOnce(null);

    const respuesta = await pagar("MP");

    expect(respuesta.status).toBe(502);
    expect(registrarPago).not.toHaveBeenCalled();
    expect((await respuesta.json()).error).toMatch(/No es un problema de los datos cargados/);
  });

  it("a Mercado Pago se lo llama ANTES de registrar el pago", async () => {
    const orden: string[] = [];
    crearPreferenciaDePago.mockImplementationOnce(async () => {
      orden.push("crearPreferenciaDePago");
      return { id: "pref-1", init_point: "https://mp.test/pref-1" };
    });
    registrarPago.mockImplementationOnce(async () => {
      orden.push("registrarPago");
      return { pago: { id: ID_PAGO, medio: "MP", estado: "PENDIENTE" }, renovada: false, fechaFin };
    });

    await pagar("MP");

    expect(orden).toEqual(["crearPreferenciaDePago", "registrarPago"]);
  });

  it("la refExterna del body se descarta: la escribe el webhook, no quien llama", async () => {
    registrarPago.mockResolvedValueOnce({
      pago: { id: ID_PAGO, medio: "EFECTIVO", estado: "APROBADO" }, renovada: true, fechaFin,
    });

    await pagar("EFECTIVO", { refExterna: "mp-123" });

    expect(registrarPago.mock.calls[0]?.[0]).not.toHaveProperty("refExterna");
  });
});
