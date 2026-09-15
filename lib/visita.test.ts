// Reglas de H1, H2 y H3. La duración no se guarda (ADR 0003) y el escaneo
// depende del estado del socio, no de lo que manda el cliente.
import { describe, it, expect } from "vitest";
import {
  DEBOUNCE_ESCANEO_SEGUNDOS,
  accionDeEscaneo,
  calcularDuracionMin,
  duracionDeVisita,
  inicioDelDiaArgentina,
  puedeEscanear,
  tokenQrValido,
} from "./visita";

const ahora = new Date("2026-09-15T22:00:00Z");
const TOKEN = "qr-puerta-principal-2026";

describe("calcularDuracionMin (ADR 0003)", () => {
  it("calcula la duración en minutos redondeada", () => {
    expect(calcularDuracionMin(new Date("2026-09-15T10:00:00Z"), new Date("2026-09-15T11:30:00Z"))).toBe(90);
  });

  it("borde: ingreso y egreso en el mismo instante da cero", () => {
    const momento = new Date("2026-09-15T10:00:00Z");
    expect(calcularDuracionMin(momento, momento)).toBe(0);
  });
});

describe("duracionDeVisita", () => {
  it("una visita CERRADA informa su duración", () => {
    expect(
      duracionDeVisita({
        ingresoAt: new Date("2026-09-15T10:00:00Z"),
        egresoAt: new Date("2026-09-15T11:00:00Z"),
        estado: "CERRADA",
      }),
    ).toBe(60);
  });

  it("una visita INCOMPLETA no computa duración (spec §6)", () => {
    expect(
      duracionDeVisita({
        ingresoAt: new Date("2026-09-15T10:00:00Z"),
        egresoAt: null,
        estado: "INCOMPLETA",
      }),
    ).toBeNull();
  });
});

describe("accionDeEscaneo (flujo §5)", () => {
  it("sin visita abierta, abre", () => {
    expect(accionDeEscaneo(false)).toBe("ABRIR");
  });

  it("con visita abierta, cierra", () => {
    expect(accionDeEscaneo(true)).toBe("CERRAR");
  });
});

describe("tokenQrValido (H1)", () => {
  it("acepta el token de la puerta", () => {
    expect(tokenQrValido(TOKEN, TOKEN)).toBe(true);
  });

  it("rechaza otro token", () => {
    expect(tokenQrValido("cualquier-cosa", TOKEN)).toBe(false);
  });

  it("borde: sin token configurado no valida nada (falla cerrado)", () => {
    expect(tokenQrValido("", "")).toBe(false);
  });
});

describe("puedeEscanear (H1 + H2)", () => {
  const base = { estadoMembresia: "ACTIVA" as const, token: TOKEN, tokenEsperado: TOKEN };

  it("acepta con membresía ACTIVA, QR válido y sin escaneo reciente", () => {
    const resultado = puedeEscanear({ ...base, ultimoMovimientoAt: null }, ahora);
    expect(resultado.ok).toBe(true);
  });

  it("rechaza con membresía vencida", () => {
    const resultado = puedeEscanear(
      { ...base, estadoMembresia: "VENCIDA", ultimoMovimientoAt: null },
      ahora,
    );
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["MEMBRESIA_INACTIVA"]);
  });

  it("rechaza un segundo escaneo dentro de los 60 segundos e informa cuánto falta", () => {
    const resultado = puedeEscanear(
      { ...base, ultimoMovimientoAt: new Date("2026-09-15T21:59:40Z") },
      ahora,
    );
    const motivo = resultado.motivos.find((m) => m.codigo === "ESCANEO_DUPLICADO");
    expect(motivo?.datos).toEqual({ segundosTranscurridos: 20, segundosRestantes: 40 });
  });

  it("borde: exactamente a los 60 segundos ya deja escanear", () => {
    const resultado = puedeEscanear(
      {
        ...base,
        ultimoMovimientoAt: new Date(ahora.getTime() - DEBOUNCE_ESCANEO_SEGUNDOS * 1000),
      },
      ahora,
    );
    expect(resultado.ok).toBe(true);
  });
});

describe("inicioDelDiaArgentina (H3)", () => {
  it("usa el día local argentino aunque el servidor esté en UTC", () => {
    expect(inicioDelDiaArgentina(new Date("2026-09-08T00:30:00Z")).toISOString()).toBe(
      "2026-09-07T03:00:00.000Z",
    );
  });

  it("borde: a las 21:00 UTC ya es el día siguiente en Argentina", () => {
    expect(inicioDelDiaArgentina(new Date("2026-09-08T21:30:00Z")).toISOString()).toBe(
      "2026-09-08T03:00:00.000Z",
    );
  });
});
