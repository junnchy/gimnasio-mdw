import { describe, it, expect } from "vitest";
import { aFilaClase, filtrarClases, type FilaClase } from "./filaClase";

const clase = (ocupados: number, cupoMaximo: number, profesorId = "p1") => ({
  id: "c1",
  nombre: "Funcional",
  inicio: new Date("2026-10-14T01:30:00Z"),
  duracionMin: 45,
  sala: "Sala 2",
  cupoMaximo,
  profesor: { id: profesorId, nombre: "Laura" },
  _count: { reservas: ocupados },
});

describe("aFilaClase", () => {
  it("formatea en la hora del gimnasio, no en UTC", () => {
    const fila = aFilaClase(clase(0, 10), "otro");
    expect(fila.fecha).toBe("martes, 13 de octubre");
    expect(fila.horario).toBe("22:30 a 23:15");
  });

  it("marca sin cupo cuando las confirmadas llegan al máximo", () => {
    expect(aFilaClase(clase(9, 10), "x").sinCupo).toBe(false);
    expect(aFilaClase(clase(10, 10), "x").sinCupo).toBe(true);
  });

  it("esMia sale del id de la sesión, y el id del profesor no cruza al cliente", () => {
    const fila = aFilaClase(clase(0, 10, "p1"), "p1");
    expect(fila.esMia).toBe(true);
    expect(aFilaClase(clase(0, 10, "p1"), "p2").esMia).toBe(false);
    expect(JSON.stringify(fila)).not.toContain("p1");
  });
});

describe("filtrarClases", () => {
  const base = { fecha: "", horario: "", sala: null, profesor: "", ocupados: 0, cupo: 1 };
  const filas: FilaClase[] = [
    { ...base, id: "a", nombre: "A", sinCupo: false, esMia: true },
    { ...base, id: "b", nombre: "B", sinCupo: true, esMia: false },
  ];

  it("TODAS no filtra", () => {
    expect(filtrarClases(filas, "TODAS").map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("CON_LUGAR deja afuera las que no tienen cupo", () => {
    expect(filtrarClases(filas, "CON_LUGAR").map((f) => f.id)).toEqual(["a"]);
  });

  it("MIAS deja solo las que dicta quien mira", () => {
    expect(filtrarClases(filas, "MIAS").map((f) => f.id)).toEqual(["a"]);
  });
});
