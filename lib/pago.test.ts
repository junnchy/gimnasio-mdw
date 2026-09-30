// Reglas de H7: qué estado nace un pago según el medio, y cómo se renueva la
// membresía cuando el pago queda APROBADO.
import { describe, it, expect } from "vitest";
import { estadoInicialDePago, puedeRegistrarPago, renovacionPorPago, transicionPorMercadoPago } from "./pago";

const ahora = new Date("2026-09-15T12:00:00Z");

describe("estadoInicialDePago (spec §8)", () => {
  it("EFECTIVO nace APROBADO: lo registra el admin con la plata en la mano", () => {
    expect(estadoInicialDePago("EFECTIVO")).toBe("APROBADO");
  });

  it("MP nace PENDIENTE: lo aprueba el webhook, no quien llama", () => {
    expect(estadoInicialDePago("MP")).toBe("PENDIENTE");
  });
});

describe("renovacionPorPago (H7)", () => {
  it("un pago aprobado sobre una membresía vencida cuenta desde hoy", () => {
    const resultado = renovacionPorPago(
      { estadoPago: "APROBADO", duracionDias: 30, fechaFinActual: new Date("2026-08-01T12:00:00Z") },
      ahora,
    );
    expect(resultado.renueva).toBe(true);
    expect(resultado.nuevaFechaFin?.toISOString()).toBe("2026-10-15T12:00:00.000Z");
  });

  it("un pago rechazado no renueva y deja constancia del intento", () => {
    const resultado = renovacionPorPago(
      { estadoPago: "RECHAZADO", duracionDias: 30, fechaFinActual: new Date("2026-08-01T12:00:00Z") },
      ahora,
    );
    expect(resultado).toEqual({ renueva: false, nuevaFechaFin: null });
  });

  it("un pago pendiente tampoco renueva", () => {
    expect(
      renovacionPorPago(
        { estadoPago: "PENDIENTE", duracionDias: 30, fechaFinActual: new Date("2026-10-01T12:00:00Z") },
        ahora,
      ).renueva,
    ).toBe(false);
  });

  it("borde: renovar antes de vencer suma sobre el vencimiento, no regala días", () => {
    const resultado = renovacionPorPago(
      { estadoPago: "APROBADO", duracionDias: 30, fechaFinActual: new Date("2026-09-25T12:00:00Z") },
      ahora,
    );
    expect(resultado.nuevaFechaFin?.toISOString()).toBe("2026-10-25T12:00:00.000Z");
  });
});

describe("puedeRegistrarPago", () => {
  it("acepta sobre una membresía activa", () => {
    expect(puedeRegistrarPago({ estadoMembresia: "ACTIVA" }).ok).toBe(true);
  });

  it("rechaza sobre una membresía cancelada (ADR 0002: cancelar es un hecho)", () => {
    const resultado = puedeRegistrarPago({ estadoMembresia: "CANCELADA" });
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["MEMBRESIA_CANCELADA"]);
  });
});

describe("transicionPorMercadoPago (webhook, spec §8)", () => {
  const pendienteMp = { medio: "MP", estadoActual: "PENDIENTE" } as const;

  it("approved → APROBADO", () => {
    expect(transicionPorMercadoPago({ ...pendienteMp, estadoMercadoPago: "approved" })).toBe("APROBADO");
  });

  it("rejected y cancelled → RECHAZADO: queda constancia del intento (H7)", () => {
    expect(transicionPorMercadoPago({ ...pendienteMp, estadoMercadoPago: "rejected" })).toBe("RECHAZADO");
    expect(transicionPorMercadoPago({ ...pendienteMp, estadoMercadoPago: "cancelled" })).toBe("RECHAZADO");
  });

  it("los estados intermedios no cambian nada", () => {
    for (const estado of ["pending", "in_process", "authorized", "in_mediation"] as const) {
      expect(transicionPorMercadoPago({ ...pendienteMp, estadoMercadoPago: estado })).toBeNull();
    }
  });

  it("un pago ya APROBADO no se vuelve a mover: la notificación repetida no renueva dos veces", () => {
    expect(
      transicionPorMercadoPago({ medio: "MP", estadoActual: "APROBADO", estadoMercadoPago: "approved" }),
    ).toBeNull();
  });

  it("un pago en EFECTIVO nunca lo toca Mercado Pago", () => {
    expect(
      transicionPorMercadoPago({ medio: "EFECTIVO", estadoActual: "PENDIENTE", estadoMercadoPago: "rejected" }),
    ).toBeNull();
  });

  it("refunded no está en la spec: no cambia nada", () => {
    expect(transicionPorMercadoPago({ ...pendienteMp, estadoMercadoPago: "refunded" })).toBeNull();
  });
});
