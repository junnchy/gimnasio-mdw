import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const { crearPlan, requerirUsuario } = vi.hoisted(() => ({ crearPlan: vi.fn(), requerirUsuario: vi.fn() }));
vi.mock("@/lib/db/planes", () => ({ crearPlan, listarPlanes: vi.fn() }));
// Clase 6: estos casos corren con sesión de ADMIN; los 401/403 se prueban abajo.
vi.mock("@/lib/auth", () => ({ requerirUsuario }));

import { POST } from "./route";
import { NoAutenticado, NoAutorizado } from "@/lib/errores";

beforeEach(() => {
  requerirUsuario.mockReset();
  crearPlan.mockReset();
  requerirUsuario.mockResolvedValue({ id: "admin-1", rol: "ADMIN" });
});

describe("POST /api/planes", () => {
  it("devuelve 400 cuando el body está vacío", async () => {
    const respuesta = await POST(new Request("http://localhost/api/planes", { method: "POST" }));
    expect(respuesta.status).toBe(400);
    expect(crearPlan).not.toHaveBeenCalled();
  });

  it("devuelve 409 cuando el nombre ya existe", async () => {
    crearPlan.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const respuesta = await POST(new Request("http://localhost/api/planes", {
      method: "POST",
      body: JSON.stringify({ nombre: "Mensual", precio: 25000, duracionDias: 30 }),
      headers: { "content-type": "application/json" },
    }));
    expect(respuesta.status).toBe(409);
  });

  it("sin sesión → 401 y no toca la base", async () => {
    requerirUsuario.mockRejectedValueOnce(new NoAutenticado());
    const respuesta = await POST(new Request("http://localhost/api/planes", { method: "POST" }));
    expect(respuesta.status).toBe(401);
    expect(crearPlan).not.toHaveBeenCalled();
  });

  it("un socio no crea planes → 403, aunque el body esté bien", async () => {
    requerirUsuario.mockRejectedValueOnce(new NoAutorizado());
    const respuesta = await POST(new Request("http://localhost/api/planes", {
      method: "POST",
      body: JSON.stringify({ nombre: "Anual", precio: 250000, duracionDias: 365 }),
      headers: { "content-type": "application/json" },
    }));
    expect(respuesta.status).toBe(403);
    expect(requerirUsuario).toHaveBeenCalledWith("ADMIN");
    expect(crearPlan).not.toHaveBeenCalled();
  });
});
