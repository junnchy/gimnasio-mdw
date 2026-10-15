import { describe, it, expect } from "vitest";
import { aFilaReserva, filtrarReservas, type FilaReserva } from "./filaReserva";

const reserva = (inicio: string, duracionMin = 60) => ({
  id: "r1",
  estado: "CONFIRMADA" as const,
  presente: false,
  clase: { nombre: "Spinning", inicio: new Date(inicio), duracionMin, sala: "Principal" },
});

describe("aFilaReserva", () => {
  it("formatea fecha y horario en la hora del gimnasio, no en UTC", () => {
    const fila = aFilaReserva(reserva("2026-10-13T21:00:00Z"));
    expect(fila.fecha).toBe("martes, 13 de octubre");
    expect(fila.horario).toBe("18:00 a 19:00");
  });

  it("una clase de la noche queda en su día aunque en UTC ya sea el siguiente", () => {
    const fila = aFilaReserva(reserva("2026-10-14T01:30:00Z", 45));
    expect(fila.fecha).toBe("martes, 13 de octubre");
    expect(fila.horario).toBe("22:30 a 23:15");
  });

  it("devuelve solo datos planos, que pueden cruzar a un componente de cliente", () => {
    const fila = aFilaReserva(reserva("2026-10-13T21:00:00Z"));
    expect(JSON.parse(JSON.stringify(fila))).toEqual(fila);
  });
});

describe("filtrarReservas", () => {
  const filas: FilaReserva[] = [
    { id: "a", clase: "Spinning", fecha: "", horario: "", sala: null, estado: "CONFIRMADA", presente: false },
    { id: "b", clase: "Funcional", fecha: "", horario: "", sala: null, estado: "CANCELADA", presente: false },
  ];

  it("TODAS no filtra", () => {
    expect(filtrarReservas(filas, "TODAS").map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("filtra por estado", () => {
    expect(filtrarReservas(filas, "CONFIRMADA").map((f) => f.id)).toEqual(["a"]);
    expect(filtrarReservas(filas, "CANCELADA").map((f) => f.id)).toEqual(["b"]);
  });
});
