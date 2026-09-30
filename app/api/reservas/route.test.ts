// Clase 6 — el socio sale de la sesión, nunca del body.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoAutorizado } from "@/lib/errores";

const { requerirUsuario, listarReservasDeSocio } = vi.hoisted(() => ({
  requerirUsuario: vi.fn(),
  listarReservasDeSocio: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirUsuario }));
vi.mock("@/lib/db/reservas", () => ({
  listarReservasDeSocio,
  claseParaReservar: vi.fn(),
  crearReserva: vi.fn(),
  reservasVigentesDelSocio: vi.fn(),
}));
vi.mock("@/lib/db/membresias", () => ({ obtenerMembresiaActual: vi.fn() }));

import { NextRequest } from "next/server";
import { GET } from "./route";

beforeEach(() => vi.resetAllMocks());

describe("GET /api/reservas", () => {
  it("lista solo las reservas del socio de la sesión", async () => {
    requerirUsuario.mockResolvedValueOnce({ id: "socio-1", rol: "SOCIO" });
    listarReservasDeSocio.mockResolvedValueOnce([]);

    const respuesta = await GET(new NextRequest("http://localhost/api/reservas?socioId=otro"));

    expect(respuesta.status).toBe(200);
    // El ?socioId= del query se ignora: la consulta lleva el de la sesión.
    expect(listarReservasDeSocio).toHaveBeenCalledWith("socio-1", 50);
  });

  it("un admin no tiene reservas propias → 403", async () => {
    requerirUsuario.mockRejectedValueOnce(new NoAutorizado());

    expect((await GET(new NextRequest("http://localhost/api/reservas"))).status).toBe(403);
    expect(listarReservasDeSocio).not.toHaveBeenCalled();
  });
});
