// Reglas de H4, H5 y H6. Cada bloque cubre los tres casos que pide la clase 5:
// camino feliz, rechazo y borde.
import { describe, it, expect } from "vitest";
import { cuposDisponibles, puedeCancelar, puedeMarcarAsistencia, puedeReservar, seSolapan } from "./reserva";

const ahora = new Date("2026-09-15T10:00:00Z");

const claseFutura = {
  nombre: "Spinning",
  inicio: new Date("2026-09-16T10:00:00Z"),
  duracionMin: 60,
  cupoMaximo: 20,
  reservasConfirmadas: 3,
};

describe("cuposDisponibles (spec §6: nunca negativo)", () => {
  it("descuenta las confirmadas", () => {
    expect(cuposDisponibles({ cupoMaximo: 20, reservasConfirmadas: 3 })).toBe(17);
  });

  it("borde: no baja de cero aunque haya más reservas que cupo", () => {
    expect(cuposDisponibles({ cupoMaximo: 1, reservasConfirmadas: 5 })).toBe(0);
  });
});

describe("seSolapan", () => {
  it("se solapan si una empieza antes de que termine la otra", () => {
    const a = { inicio: new Date("2026-09-16T10:00:00Z"), duracionMin: 60 };
    const b = { inicio: new Date("2026-09-16T10:30:00Z"), duracionMin: 60 };
    expect(seSolapan(a, b)).toBe(true);
  });

  it("borde: pegadas no se solapan (una termina cuando la otra empieza)", () => {
    const a = { inicio: new Date("2026-09-16T10:00:00Z"), duracionMin: 60 };
    const b = { inicio: new Date("2026-09-16T11:00:00Z"), duracionMin: 60 };
    expect(seSolapan(a, b)).toBe(false);
  });
});

describe("puedeReservar (H4)", () => {
  it("acepta con membresía ACTIVA, cupo y sin solapamiento", () => {
    const resultado = puedeReservar(
      { estadoMembresia: "ACTIVA", clase: claseFutura, reservasVigentes: [] },
      ahora,
    );
    expect(resultado.ok).toBe(true);
    expect(resultado.motivos).toEqual([]);
  });

  it("rechaza con membresía vencida", () => {
    const resultado = puedeReservar(
      { estadoMembresia: "VENCIDA", clase: claseFutura, reservasVigentes: [] },
      ahora,
    );
    expect(resultado.ok).toBe(false);
    expect(resultado.motivos.map((m) => m.codigo)).toContain("MEMBRESIA_INACTIVA");
  });

  it("rechaza sin cupo e informa cuántas reservas hay", () => {
    const resultado = puedeReservar(
      {
        estadoMembresia: "ACTIVA",
        clase: { ...claseFutura, cupoMaximo: 1, reservasConfirmadas: 1 },
        reservasVigentes: [],
      },
      ahora,
    );
    const motivo = resultado.motivos.find((m) => m.codigo === "SIN_CUPO");
    expect(motivo?.datos).toEqual({ cupoMaximo: 1, reservasConfirmadas: 1 });
  });

  it("rechaza por solapamiento y devuelve los nombres de las clases", () => {
    const resultado = puedeReservar(
      {
        estadoMembresia: "ACTIVA",
        clase: claseFutura,
        reservasVigentes: [
          { claseNombre: "Funcional", inicio: new Date("2026-09-16T10:30:00Z"), duracionMin: 45 },
        ],
      },
      ahora,
    );
    const motivo = resultado.motivos.find((m) => m.codigo === "HORARIO_SOLAPADO");
    expect(motivo?.datos).toEqual({ clases: ["Funcional"] });
  });

  it("acumula todos los motivos, no corta en el primero", () => {
    const resultado = puedeReservar(
      {
        estadoMembresia: "VENCIDA",
        clase: { ...claseFutura, cupoMaximo: 1, reservasConfirmadas: 1 },
        reservasVigentes: [],
      },
      ahora,
    );
    expect(resultado.motivos.map((m) => m.codigo).sort()).toEqual(["MEMBRESIA_INACTIVA", "SIN_CUPO"]);
  });

  it("borde: una clase que arranca justo ahora ya no se puede reservar", () => {
    const resultado = puedeReservar(
      { estadoMembresia: "ACTIVA", clase: { ...claseFutura, inicio: ahora }, reservasVigentes: [] },
      ahora,
    );
    expect(resultado.motivos.map((m) => m.codigo)).toContain("CLASE_YA_INICIADA");
  });
});

describe("puedeCancelar (H5)", () => {
  it("acepta una reserva confirmada a futuro", () => {
    const resultado = puedeCancelar(
      { estado: "CONFIRMADA", claseInicio: new Date("2026-09-16T10:00:00Z") },
      ahora,
    );
    expect(resultado.ok).toBe(true);
  });

  it("rechaza una reserva ya cancelada", () => {
    const resultado = puedeCancelar(
      { estado: "CANCELADA", claseInicio: new Date("2026-09-16T10:00:00Z") },
      ahora,
    );
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["RESERVA_NO_CONFIRMADA"]);
  });

  it("borde: en el instante en que la clase arranca ya no se cancela", () => {
    const resultado = puedeCancelar({ estado: "CONFIRMADA", claseInicio: ahora }, ahora);
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["CLASE_YA_INICIADA"]);
  });
});

describe("puedeMarcarAsistencia (H6)", () => {
  const claseDictada = { claseInicio: new Date("2026-09-15T08:00:00Z"), claseDuracionMin: 60 };

  it("acepta una reserva confirmada de una clase ya dictada", () => {
    const resultado = puedeMarcarAsistencia({ estado: "CONFIRMADA", ...claseDictada }, ahora);
    expect(resultado.ok).toBe(true);
  });

  it("rechaza si la reserva está cancelada", () => {
    const resultado = puedeMarcarAsistencia({ estado: "CANCELADA", ...claseDictada }, ahora);
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["RESERVA_NO_CONFIRMADA"]);
  });

  it("rechaza si la clase todavía no terminó", () => {
    const resultado = puedeMarcarAsistencia(
      { estado: "CONFIRMADA", claseInicio: new Date("2026-09-15T09:30:00Z"), claseDuracionMin: 60 },
      ahora,
    );
    expect(resultado.motivos.map((m) => m.codigo)).toEqual(["CLASE_NO_DICTADA"]);
  });

  it("borde: el minuto exacto en que termina la clase ya habilita", () => {
    const resultado = puedeMarcarAsistencia(
      { estado: "CONFIRMADA", claseInicio: new Date("2026-09-15T09:00:00Z"), claseDuracionMin: 60 },
      ahora,
    );
    expect(resultado.ok).toBe(true);
  });
});
