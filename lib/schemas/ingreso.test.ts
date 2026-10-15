import { describe, it, expect } from "vitest";
import { parametrosIngreso } from "./ingreso";

const destino = (callbackUrl: unknown) => parametrosIngreso.parse({ callbackUrl }).callbackUrl;

describe("parametrosIngreso: callbackUrl (sin open redirect)", () => {
  it("acepta una ruta interna", () => {
    expect(destino("/reservas/abc123")).toBe("/reservas/abc123");
    expect(destino("/")).toBe("/");
  });

  it("descarta una dirección de otro sitio", () => {
    expect(destino("https://sitio-falso.com")).toBeUndefined();
    expect(destino("//sitio-falso.com")).toBeUndefined();
    expect(destino("/\\sitio-falso.com")).toBeUndefined();
  });

  it("descarta valores que no son un texto razonable", () => {
    expect(destino(["/a", "/b"])).toBeUndefined();
    expect(destino(`/${"x".repeat(300)}`)).toBeUndefined();
  });

  it("sin parámetros, no hay destino ni error", () => {
    expect(parametrosIngreso.parse({})).toEqual({});
  });
});

describe("parametrosIngreso: error", () => {
  it("conserva el código que manda Auth.js", () => {
    expect(parametrosIngreso.parse({ error: "AccessDenied" }).error).toBe("AccessDenied");
  });

  it("ignora un error armado a mano demasiado largo", () => {
    expect(parametrosIngreso.parse({ error: "x".repeat(80) }).error).toBeUndefined();
  });
});
