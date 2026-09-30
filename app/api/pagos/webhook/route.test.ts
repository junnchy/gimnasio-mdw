// Clase 7 — el webhook no le cree a la notificación: consulta a Mercado Pago,
// y elige el status para que Mercado Pago reintente solo cuando sirve.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerPagoDeMercadoPago, aplicarEstadoDeMercadoPago } = vi.hoisted(() => ({
  obtenerPagoDeMercadoPago: vi.fn(),
  aplicarEstadoDeMercadoPago: vi.fn(),
}));
vi.mock("@/lib/servicios/mercadoPago", () => ({ obtenerPagoDeMercadoPago }));
vi.mock("@/lib/db/pagos", () => ({ aplicarEstadoDeMercadoPago }));

import { POST } from "./route";

const ID_PAGO = "ckpago00000000000000000001";

const notificar = (body: unknown) =>
  POST(new Request("http://localhost/api/pagos/webhook", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/pagos/webhook", () => {
  it("pago aprobado → consulta a Mercado Pago y aplica el estado REAL, no el del body", async () => {
    obtenerPagoDeMercadoPago.mockResolvedValueOnce({ id: "999", status: "approved", external_reference: ID_PAGO });
    aplicarEstadoDeMercadoPago.mockResolvedValueOnce({ resultado: "ACTUALIZADO", estado: "APROBADO", renovada: true });

    const respuesta = await notificar({ type: "payment", data: { id: 999 }, status: "rejected" });

    expect(respuesta.status).toBe(200);
    expect(obtenerPagoDeMercadoPago).toHaveBeenCalledWith("999");
    expect(aplicarEstadoDeMercadoPago).toHaveBeenCalledWith(
      ID_PAGO,
      { idPagoMercadoPago: "999", estadoMercadoPago: "approved" },
      expect.any(Date),
    );
  });

  it("id con caracteres raros → 400 y no consulta a Mercado Pago", async () => {
    const respuesta = await notificar({ type: "payment", data: { id: "../users/me" } });

    expect(respuesta.status).toBe(400);
    expect(obtenerPagoDeMercadoPago).not.toHaveBeenCalled();
  });

  it("otro tipo de evento → 200 IGNORADA, sin consultar nada", async () => {
    const respuesta = await notificar({ type: "merchant_order", data: { id: "1" } });

    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).resultado).toBe("IGNORADA");
    expect(obtenerPagoDeMercadoPago).not.toHaveBeenCalled();
  });

  it("Mercado Pago caído → 502, para que reintente, y no toca la base", async () => {
    obtenerPagoDeMercadoPago.mockResolvedValueOnce(null);

    const respuesta = await notificar({ type: "payment", data: { id: "999" } });

    expect(respuesta.status).toBe(502);
    expect(aplicarEstadoDeMercadoPago).not.toHaveBeenCalled();
  });

  it("pago sin external_reference (no es nuestro) → 200, para que no insista", async () => {
    obtenerPagoDeMercadoPago.mockResolvedValueOnce({ id: "999", status: "approved", external_reference: null });

    const respuesta = await notificar({ type: "payment", data: { id: "999" } });

    expect(respuesta.status).toBe(200);
    expect(aplicarEstadoDeMercadoPago).not.toHaveBeenCalled();
  });

  it("la base falla → 500, para que Mercado Pago reintente", async () => {
    obtenerPagoDeMercadoPago.mockResolvedValueOnce({ id: "999", status: "approved", external_reference: ID_PAGO });
    aplicarEstadoDeMercadoPago.mockRejectedValueOnce(new Error("base caída"));

    const respuesta = await notificar({ type: "payment", data: { id: "999" } });

    expect(respuesta.status).toBe(500);
  });
});
