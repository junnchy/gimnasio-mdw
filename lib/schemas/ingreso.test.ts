import { describe, it, expect } from "vitest";
import { parametrosIngreso } from "./ingreso";

const destino = (callbackUrl: unknown) => parametrosIngreso.parse({ callbackUrl }).callbackUrl;

describe("parametrosIngreso: callbackUrl (sin open redirect)", () => {
  it("acepta una ruta interna", () => {
    expect(destino("/reservas/abc123")).toBe("/reservas/abc123");
    expect(destino("/")).toBe("/");
    expect(destino("/reservas?estado=CONFIRMADA#lista")).toBe("/reservas?estado=CONFIRMADA#lista");
  });

  it("devuelve la ruta normalizada, no el texto tal como vino", () => {
    expect(destino("/reser\tvas")).toBe("/reservas");
    expect(destino("/a/../reservas")).toBe("/reservas");
  });

  it("descarta una dirección de otro sitio", () => {
    expect(destino("https://sitio-falso.com")).toBeUndefined();
    expect(destino("//sitio-falso.com")).toBeUndefined();
    expect(destino("/\\sitio-falso.com")).toBeUndefined();
  });

  it("descarta rutas que el navegador lee como otro dominio (tab, salto de línea)", () => {
    expect(destino("/\t/sitio-falso.com")).toBeUndefined();
    expect(destino("/\n/sitio-falso.com")).toBeUndefined();
    expect(destino("/\r/sitio-falso.com")).toBeUndefined();
    expect(destino("\\/sitio-falso.com")).toBeUndefined();
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
  it("conserva un código conocido de Auth.js", () => {
    expect(parametrosIngreso.parse({ error: "AccessDenied" }).error).toBe("AccessDenied");
  });

  it("un código desconocido o armado a mano se trata como Default", () => {
    expect(parametrosIngreso.parse({ error: "<script>" }).error).toBe("Default");
    expect(parametrosIngreso.parse({ error: "x".repeat(80) }).error).toBe("Default");
  });
});
