// Clase 6 — los tres casos que se muestran en el parcial, sobre una
// operación de socio: sin sesión, rol equivocado y recurso ajeno.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoAutenticado, NoAutorizado } from "@/lib/errores";

const { requerirUsuario, obtenerReservaDeSocio, cancelarReserva } = vi.hoisted(() => ({
  requerirUsuario: vi.fn(),
  obtenerReservaDeSocio: vi.fn(),
  cancelarReserva: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirUsuario }));
vi.mock("@/lib/db/reservas", () => ({ obtenerReservaDeSocio, cancelarReserva }));

import { POST } from "./route";

const ID_RESERVA = "ckreserva0000000000000001";
const socio = { id: "socio-1", email: "s@gmail.com", nombre: "Socio", rol: "SOCIO" };

const cancelar = () =>
  POST(new Request(`http://localhost/api/reservas/${ID_RESERVA}/cancelacion`, { method: "POST" }), {
    params: Promise.resolve({ id: ID_RESERVA }),
  });

beforeEach(() => vi.resetAllMocks());

describe("POST /api/reservas/:id/cancelacion", () => {
  it("sin sesión → 401 y no consulta la base", async () => {
    requerirUsuario.mockRejectedValueOnce(new NoAutenticado());

    const respuesta = await cancelar();

    expect(respuesta.status).toBe(401);
    expect(obtenerReservaDeSocio).not.toHaveBeenCalled();
  });

  it("con rol PROFESOR → 403", async () => {
    requerirUsuario.mockRejectedValueOnce(new NoAutorizado());

    expect((await cancelar()).status).toBe(403);
    expect(requerirUsuario).toHaveBeenCalledWith("SOCIO");
  });

  it("la reserva de otro socio → 404, porque el id de la sesión va en la consulta", async () => {
    requerirUsuario.mockResolvedValueOnce(socio);
    obtenerReservaDeSocio.mockResolvedValueOnce(null);

    const respuesta = await cancelar();

    expect(respuesta.status).toBe(404);
    expect(obtenerReservaDeSocio).toHaveBeenCalledWith(ID_RESERVA, "socio-1");
    expect(cancelarReserva).not.toHaveBeenCalled();
  });

  it("la reserva propia y futura → 200, cancelando con el id de la sesión", async () => {
    requerirUsuario.mockResolvedValueOnce(socio);
    obtenerReservaDeSocio.mockResolvedValueOnce({
      id: ID_RESERVA, estado: "CONFIRMADA", clase: { inicio: new Date(Date.now() + 86_400_000) },
    });
    cancelarReserva.mockResolvedValueOnce({ id: ID_RESERVA, estado: "CANCELADA" });

    const respuesta = await cancelar();

    expect(respuesta.status).toBe(200);
    expect(cancelarReserva).toHaveBeenCalledWith(ID_RESERVA, "socio-1");
  });

  it("si otra request la canceló en el medio → 409, no 404", async () => {
    requerirUsuario.mockResolvedValueOnce(socio);
    obtenerReservaDeSocio.mockResolvedValueOnce({
      id: ID_RESERVA, estado: "CONFIRMADA", clase: { inicio: new Date(Date.now() + 86_400_000) },
    });
    cancelarReserva.mockResolvedValueOnce(null);

    const respuesta = await cancelar();

    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).motivos[0].codigo).toBe("RESERVA_NO_CONFIRMADA");
  });
});
