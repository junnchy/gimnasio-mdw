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
  // Ingreso: no hay visita abierta. Egreso: hay una abierta.
  const ingreso = {
    estadoMembresia: "ACTIVA" as const,
    token: TOKEN,
    tokenEsperado: TOKEN,
    hayVisitaAbierta: false,
  };
  const egreso = { ...ingreso, hayVisitaAbierta: true };

  it("acepta el ingreso con membresía ACTIVA, QR válido y sin escaneo reciente", () => {
    const resultado = puedeEscanear({ ...ingreso, ultimoMovimientoAt: null }, ahora);
    expect(resultado.ok).toBe(true);
  });

  it("rechaza el ingreso con membresía vencida (H1)", () => {
    const resultado = puedeEscanear(
      { ...ingreso, estadoMembresia: "VENCIDA", ultimoMovimientoAt: null },
      ahora,
    );
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["MEMBRESIA_INACTIVA"]);
  });

  it("deja SALIR aunque la membresía haya vencido mientras entrenaba (H2 no pide membresía)", () => {
    const resultado = puedeEscanear(
      {
        ...egreso,
        estadoMembresia: "VENCIDA",
        ultimoMovimientoAt: new Date("2026-09-15T20:00:00Z"),
      },
      ahora,
    );
    expect(resultado.ok).toBe(true);
  });

  it("deja salir también con la membresía cancelada: si no, la visita queda ABIERTA", () => {
    const resultado = puedeEscanear(
      {
        ...egreso,
        estadoMembresia: "CANCELADA",
        ultimoMovimientoAt: new Date("2026-09-15T20:00:00Z"),
      },
      ahora,
    );
    expect(resultado.ok).toBe(true);
  });

  it("el QR inválido sí corta el egreso: el token se valida en los dos sentidos", () => {
    const resultado = puedeEscanear(
      {
        ...egreso,
        token: "otro-token",
        ultimoMovimientoAt: new Date("2026-09-15T20:00:00Z"),
      },
      ahora,
    );
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["QR_INVALIDO"]);
  });

  it("rechaza un segundo escaneo dentro de los 60 segundos e informa cuánto falta", () => {
    const resultado = puedeEscanear(
      { ...ingreso, ultimoMovimientoAt: new Date("2026-09-15T21:59:40Z") },
      ahora,
    );
    const motivo = resultado.motivos.find((m) => m.codigo === "ESCANEO_DUPLICADO");
    expect(motivo?.datos).toEqual({ segundosTranscurridos: 20, segundosRestantes: 40 });
  });

  it("el debounce también corta el egreso (H2)", () => {
    const resultado = puedeEscanear(
      { ...egreso, ultimoMovimientoAt: new Date("2026-09-15T21:59:40Z") },
      ahora,
    );
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["ESCANEO_DUPLICADO"]);
  });

  it("borde: exactamente a los 60 segundos ya deja escanear", () => {
    const resultado = puedeEscanear(
      {
        ...ingreso,
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
