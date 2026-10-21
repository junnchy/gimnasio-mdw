import { describe, it, expect } from "vitest";
import { crearParametrosIngreso, parametrosIngreso } from "./ingreso";

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
    expect(destino(`/${"x".repeat(310)}`)).toBeUndefined();
  });

  it("sin parámetros, no hay destino ni error", () => {
    expect(parametrosIngreso.parse({})).toEqual({});
  });
});

describe("parametrosIngreso: URL absoluta del mismo origen (la que manda Auth.js)", () => {
  const ORIGEN = "https://gimnasio-mdw.vercel.app";
  const destinoCon = (callbackUrl: unknown) => crearParametrosIngreso(ORIGEN).parse({ callbackUrl }).callbackUrl;

  it("acepta una URL de nuestro origen y devuelve solo la ruta", () => {
    expect(destinoCon(`${ORIGEN}/reservas/abc?x=1`)).toBe("/reservas/abc?x=1");
  });

  it("descarta otro origen, aunque se parezca", () => {
    expect(destinoCon("https://sitio-falso.com/reservas")).toBeUndefined();
    expect(destinoCon("https://gimnasio-mdw.vercel.app.sitio-falso.com/")).toBeUndefined();
    expect(destinoCon("http://gimnasio-mdw.vercel.app/reservas")).toBeUndefined();
  });

  it("sin origen conocido, una URL absoluta se descarta", () => {
    expect(destino(`${ORIGEN}/reservas`)).toBeUndefined();
  });

  it("las rutas relativas siguen funcionando igual", () => {
    expect(destinoCon("/reservas")).toBe("/reservas");
    expect(destinoCon("//sitio-falso.com")).toBeUndefined();
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
