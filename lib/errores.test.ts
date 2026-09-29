// Clase 6 — las excepciones de sesión se traducen en un solo lugar.
import { describe, expect, it, vi } from "vitest";
import { NoAutenticado, NoAutorizado, responderError } from "./errores";

describe("responderError", () => {
  it("sin sesión → 401", async () => {
    const respuesta = responderError("GET /x", new NoAutenticado());
    expect(respuesta.status).toBe(401);
    expect(await respuesta.json()).toEqual({ error: "No autenticado" });
  });

  it("rol insuficiente → 403", async () => {
    const respuesta = responderError("GET /x", new NoAutorizado());
    expect(respuesta.status).toBe(403);
  });

  it("cualquier otra cosa → 500 sin detalle para el cliente, con detalle en el log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const respuesta = responderError("GET /x", new Error("password de la base: hunter2"));

    expect(respuesta.status).toBe(500);
    expect(JSON.stringify(await respuesta.json())).not.toContain("hunter2");
    expect(log).toHaveBeenCalledWith("GET /x", expect.any(Error));
    log.mockRestore();
  });
});
