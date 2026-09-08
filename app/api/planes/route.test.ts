import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const { crearPlan } = vi.hoisted(() => ({ crearPlan: vi.fn() }));
vi.mock("@/lib/db/planes", () => ({ crearPlan, listarPlanes: vi.fn() }));

import { POST } from "./route";

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
});
