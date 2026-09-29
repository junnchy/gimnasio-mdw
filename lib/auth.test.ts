// Clase 6 — quién sos lo dice Google; qué sos lo dice nuestra base.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Callbacks = {
  signIn: (args: { account?: { provider: string } | null; profile?: Record<string, unknown> }) => Promise<boolean>;
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

import { NoAutenticado, NoAutorizado, esIdentidadGoogleConfiable, obtenerUsuario, requerirUsuario } from "./auth";

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

  it("normaliza el mail a minúsculas, igual que el seed", async () => {
    upsert.mockResolvedValueOnce({ id: "u3", rol: "ADMIN" });

    await configuracion.callbacks!.jwt({ token: {}, user: { email: " Juan@Gmail.com " } });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { email: "juan@gmail.com" } }));
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

describe("callback signIn: solo entra un mail que Google verificó y controla", () => {
  const google = { provider: "google" };
  const entrar = (profile?: Record<string, unknown>, account: { provider: string } | null = google) =>
    configuracion.callbacks!.signIn({ account, profile });

  it("admite un gmail verificado", async () => {
    expect(await entrar({ email: "ana@gmail.com", email_verified: true })).toBe(true);
  });

  it("admite una cuenta de Google Workspace verificada (trae hd)", async () => {
    expect(await entrar({ email: "ana@uai.edu.ar", email_verified: true, hd: "uai.edu.ar" })).toBe(true);
  });

  it("rechaza email_verified: false", async () => {
    expect(await entrar({ email: "ana@gmail.com", email_verified: false })).toBe(false);
  });

  it("rechaza si falta email_verified, el perfil o el mail", async () => {
    expect(await entrar({ email: "ana@gmail.com" })).toBe(false);
    expect(await entrar(undefined)).toBe(false);
    expect(await entrar({ email_verified: true })).toBe(false);
    expect(await entrar({ email: "  ", email_verified: true })).toBe(false);
  });

  it("rechaza un proveedor que no es Google, o sin cuenta", async () => {
    expect(await entrar({ email: "ana@gmail.com", email_verified: true }, { provider: "github" })).toBe(false);
    expect(await entrar({ email: "ana@gmail.com", email_verified: true }, null)).toBe(false);
  });

  it("rechaza un mail de otro proveedor aunque Google lo marque verificado", async () => {
    // Cuenta de Google creada con un Outlook: Google no es autoritativo para ese mail.
    expect(await entrar({ email: "ana@outlook.com", email_verified: true })).toBe(false);
  });

  it("un login rechazado no toca la base ni recibe el rol de una cuenta existente", async () => {
    // El mail coincide con un ADMIN de la base, pero Google no lo verificó.
    const admitido = await entrar({ email: "admin@gmail.com", email_verified: false });

    expect(admitido).toBe(false);
    // signIn decide sin consultar la base; y con false, Auth.js corta antes del
    // callback jwt, que es el único que hace el upsert y copia el rol al token.
    expect(upsert).not.toHaveBeenCalled();
  });

  it("la función pura es la misma que usa el callback", () => {
    expect(esIdentidadGoogleConfiable({ proveedor: "google", perfil: { email: "A@Gmail.com", email_verified: true } })).toBe(true);
  });
});
