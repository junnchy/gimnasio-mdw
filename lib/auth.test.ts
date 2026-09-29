// Clase 6 — quién sos lo dice Google; qué sos lo dice nuestra base.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Callbacks = {
  jwt: (args: { token: Record<string, unknown>; user?: { email?: string | null; name?: string | null } }) => Promise<Record<string, unknown>>;
};

const { sesion, upsert, configuracion } = vi.hoisted(() => ({
  sesion: vi.fn(),
  upsert: vi.fn(),
  configuracion: { callbacks: undefined as Callbacks | undefined },
}));

vi.mock("next-auth", () => ({
  default: (config: { callbacks: Callbacks }) => {
    configuracion.callbacks = config.callbacks;
    return { handlers: {}, auth: sesion, signIn: vi.fn(), signOut: vi.fn() };
  },
}));
vi.mock("next-auth/providers/google", () => ({ default: {} }));
vi.mock("next-auth/jwt", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { user: { upsert } } }));

import { NoAutenticado, NoAutorizado, obtenerUsuario, requerirUsuario } from "./auth";

const sesionDe = (rol: string) => ({
  user: { id: "u1", email: "ana@gmail.com", name: "Ana", rol },
});

beforeEach(() => {
  sesion.mockReset();
  upsert.mockReset();
});

describe("requerirUsuario", () => {
  it("sin sesión lanza NoAutenticado (→ 401)", async () => {
    sesion.mockResolvedValueOnce(null);
    await expect(requerirUsuario()).rejects.toBeInstanceOf(NoAutenticado);
  });

  it("con un rol que no alcanza lanza NoAutorizado (→ 403)", async () => {
    sesion.mockResolvedValueOnce(sesionDe("SOCIO"));
    await expect(requerirUsuario("ADMIN")).rejects.toBeInstanceOf(NoAutorizado);
  });

  it("con el rol pedido devuelve el usuario de la sesión", async () => {
    sesion.mockResolvedValueOnce(sesionDe("PROFESOR"));
    await expect(requerirUsuario("PROFESOR")).resolves.toEqual({
      id: "u1", email: "ana@gmail.com", nombre: "Ana", rol: "PROFESOR",
    });
  });

  it("sin rol pedido alcanza con estar logueado", async () => {
    sesion.mockResolvedValueOnce(sesionDe("SOCIO"));
    await expect(requerirUsuario()).resolves.toMatchObject({ id: "u1" });
  });
});

describe("obtenerUsuario", () => {
  it("devuelve null si la sesión no trae id", async () => {
    sesion.mockResolvedValueOnce({ user: { email: "ana@gmail.com" } });
    expect(await obtenerUsuario()).toBeNull();
  });
});

describe("callback jwt: el rol sale de nuestra base", () => {
  it("un mail nuevo nace SOCIO, el menor privilegio", async () => {
    upsert.mockResolvedValueOnce({ id: "u9", rol: "SOCIO" });

    const token = await configuracion.callbacks!.jwt({ token: {}, user: { email: "nuevo@gmail.com", name: "Nuevo" } });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: "nuevo@gmail.com" },
      create: expect.objectContaining({ rol: "SOCIO" }),
    }));
    expect(token).toMatchObject({ usuarioId: "u9", rol: "SOCIO" });
  });

  it("volver a entrar NO pisa el rol que ya tiene en la base", async () => {
    upsert.mockResolvedValueOnce({ id: "u2", rol: "PROFESOR" });

    const token = await configuracion.callbacks!.jwt({ token: {}, user: { email: "profe@gmail.com" } });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {} }));
    expect(token).toMatchObject({ rol: "PROFESOR" });
  });

  it("en los requests siguientes (sin user) no consulta la base", async () => {
    const token = await configuracion.callbacks!.jwt({ token: { usuarioId: "u2", rol: "PROFESOR" } });

    expect(upsert).not.toHaveBeenCalled();
    expect(token).toMatchObject({ usuarioId: "u2", rol: "PROFESOR" });
  });
});
