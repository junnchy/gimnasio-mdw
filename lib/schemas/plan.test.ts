import { describe, expect, it } from "vitest";
import { listarPlanesSchema, planSchema } from "./plan";

describe("planSchema", () => {
  it("rechaza un precio negativo", () => {
    expect(
      planSchema.safeParse({ nombre: "Mensual", precio: -1, duracionDias: 30 })
        .success,
    ).toBe(false);
  });

  it("limita los listados de planes", () => {
    expect(listarPlanesSchema.parse({}).limite).toBe(50);
    expect(listarPlanesSchema.safeParse({ limite: 101 }).success).toBe(false);
  });
});
