import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoAutenticado, NoAutorizado } from "@/lib/errores";
import { SIN_ENVIAR } from "@/lib/schemas/formulario";

const mocks = vi.hoisted(() => ({
  usuario: vi.fn(), reservar: vi.fn(), cancelar: vi.fn(), escanear: vi.fn(), revalidar: vi.fn(), redirigir: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirUsuario: mocks.usuario }));
vi.mock("@/lib/casos/reservarClase", () => ({ reservarClase: mocks.reservar }));
vi.mock("@/lib/casos/cancelarReserva", () => ({ cancelarReservaPropia: mocks.cancelar }));
vi.mock("@/lib/casos/registrarEscaneo", () => ({ registrarEscaneo: mocks.escanear }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));

import { reservarClaseAction } from "./clases/acciones";
import { cancelarReservaAction } from "./reservas/[id]/acciones";
import { registrarEscaneoAction } from "./escanear/acciones";

const form = (campo: string, valor: string) => { const datos = new FormData(); datos.set(campo, valor); return datos; };
const acciones = [
  () => reservarClaseAction(SIN_ENVIAR, form("claseId", "clase-1")),
  () => cancelarReservaAction("reserva-1"),
  () => registrarEscaneoAction(SIN_ENVIAR, form("qrToken", "qr-token-de-prueba")),
 ] as const;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.usuario.mockResolvedValue({ id: "socio-de-sesion", rol: "SOCIO" });
  mocks.redirigir.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
});

describe("Server Actions: fronteras y resultado", () => {
  it.each([0, 1, 2])("acción %i: sin sesión redirige sin ejecutar el caso de uso", async (indice) => {
    mocks.usuario.mockRejectedValue(new NoAutenticado());
    await expect(acciones[indice]!()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirigir).toHaveBeenCalledWith(expect.stringContaining("/ingresar?callbackUrl="));
    expect(mocks.reservar).not.toHaveBeenCalled();
    expect(mocks.cancelar).not.toHaveBeenCalled();
    expect(mocks.escanear).not.toHaveBeenCalled();
  });

  it.each([0, 1, 2])("acción %i: rol incorrecto no escribe", async (indice) => {
    mocks.usuario.mockRejectedValue(new NoAutorizado());
    expect(await acciones[indice]!()).toMatchObject({ estado: "ERROR", mensaje: expect.stringContaining("socios") });
    expect(mocks.usuario).toHaveBeenCalledWith("SOCIO");
    expect(mocks.reservar).not.toHaveBeenCalled();
    expect(mocks.cancelar).not.toHaveBeenCalled();
    expect(mocks.escanear).not.toHaveBeenCalled();
  });

  it("validación por campo sin ejecutar el caso de uso", async () => {
    expect(await reservarClaseAction(SIN_ENVIAR, form("claseId", ""))).toMatchObject({ estado: "ERROR", errores: { claseId: expect.any(Array) }, valores: { claseId: "" } });
    expect(mocks.reservar).not.toHaveBeenCalled();
    const qr = await registrarEscaneoAction(SIN_ENVIAR, form("qrToken", "x"));
    expect(qr).toMatchObject({ estado: "ERROR", errores: { qrToken: expect.any(Array) } });
    expect(qr).not.toHaveProperty("valores");
    expect(mocks.escanear).not.toHaveBeenCalled();
  });

  it("no acepta un archivo como identificador y valida también el id ligado a la cancelación", async () => {
    const datos = new FormData(); datos.set("claseId", new Blob(["clase"]));
    expect(await reservarClaseAction(SIN_ENVIAR, datos)).toMatchObject({ estado: "ERROR" });
    expect(await cancelarReservaAction(123 as unknown as string)).toMatchObject({ estado: "ERROR" });
    expect(mocks.reservar).not.toHaveBeenCalled(); expect(mocks.cancelar).not.toHaveBeenCalled();
  });

  it("reserva con identidad de sesión, revalida y deja escapar redirect", async () => {
    const datos = form("claseId", "clase-1"); datos.set("socioId", "otro"); datos.set("rol", "ADMIN");
    mocks.reservar.mockResolvedValue({ ok: true, dato: { id: "reserva-nueva" } });
    await expect(reservarClaseAction(SIN_ENVIAR, datos)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.reservar).toHaveBeenCalledWith("socio-de-sesion", "clase-1");
    expect(mocks.revalidar.mock.calls.flat()).toEqual(["/", "/clases", "/reservas", "/reservas/reserva-nueva"]);
    expect(mocks.redirigir).toHaveBeenCalledWith("/reservas/reserva-nueva");
  });

  it("rechazo de negocio arriba y selección conservada", async () => {
    mocks.reservar.mockResolvedValue({ ok: false, tipo: "CONFLICTO", motivos: [{ codigo: "SIN_CUPO", mensaje: "Sin cupo disponible." }] });
    expect(await acciones[0]()).toEqual({ estado: "ERROR", mensaje: "Sin cupo disponible.", valores: { claseId: "clase-1" } });
    expect(mocks.revalidar).not.toHaveBeenCalled();
  });

  it("cancelación ajena devuelve el mismo mensaje que una inexistente", async () => {
    mocks.cancelar.mockResolvedValue({ ok: false, tipo: "NO_ENCONTRADO", mensaje: "Reserva no encontrada" });
    expect(await cancelarReservaAction("id-ajeno")).toMatchObject({ estado: "ERROR", mensaje: "Reserva no encontrada" });
    expect(mocks.cancelar).toHaveBeenCalledWith("socio-de-sesion", "id-ajeno");
    expect(mocks.revalidar).not.toHaveBeenCalled();
  });

  it("cancelación exitosa revalida y anuncia el resultado", async () => {
    mocks.cancelar.mockResolvedValue({ ok: true, dato: { id: "reserva-1" } });
    expect(await acciones[1]()).toMatchObject({ estado: "EXITO", mensaje: expect.stringContaining("cancelada") });
    expect(mocks.revalidar.mock.calls.flat()).toEqual(["/", "/clases", "/reservas", "/reservas/reserva-1"]);
  });

  it("escaneo formatea en hora argentina, sin devolver el token ni los datos del socio", async () => {
    mocks.escanear.mockResolvedValue({ ok: true, dato: { estado: "CERRADA", ingresoAt: new Date("2026-10-28T22:00:00Z"), egresoAt: new Date("2026-10-28T23:00:00Z"), duracionMin: 60 } });
    expect(await acciones[2]()).toEqual({ estado: "EXITO", mensaje: "Salida registrada", resultado: { hora: "20:00", duracionMin: 60 } });
    expect(mocks.escanear).toHaveBeenCalledWith("socio-de-sesion", "qr-token-de-prueba");
    expect(mocks.revalidar.mock.calls.flat()).toEqual(["/", "/escanear"]);
  });
});
