// Las Server Actions de gestión: /clases/nueva (PROFESOR) y /socios/:id
// (ADMIN). Se prueban las fronteras: quién puede, qué se valida antes de
// escribir y qué vuelve a la pantalla. Los casos de uso se reemplazan: sus
// reglas tienen sus propias pruebas (lib/pago.test.ts, app/api/pagos).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoAutenticado, NoAutorizado } from "@/lib/errores";
import { SIN_ENVIAR } from "@/lib/schemas/formulario";

const mocks = vi.hoisted(() => ({
  usuario: vi.fn(), programar: vi.fn(), asignar: vi.fn(), pagar: vi.fn(), revalidar: vi.fn(), redirigir: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requerirUsuario: mocks.usuario }));
vi.mock("@/lib/casos/programarClase", () => ({ programarClase: mocks.programar }));
vi.mock("@/lib/casos/asignarMembresia", () => ({ asignarMembresia: mocks.asignar }));
vi.mock("@/lib/casos/registrarPago", () => ({ registrarPago: mocks.pagar, MENSAJE_MP_NO_DISPONIBLE: "Mercado Pago no está disponible" }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirigir }));

import { programarClaseAction } from "./clases/nueva/acciones";
import { asignarMembresiaAction, registrarPagoAction } from "./socios/[id]/acciones";

const formulario = (campos: Record<string, string>) => {
  const datos = new FormData();
  for (const [campo, valor] of Object.entries(campos)) datos.set(campo, valor);
  return datos;
};
const CLASE = { nombre: "Spinning", cupoMaximo: "20", inicio: "2026-12-01T18:00", duracionMin: "50", sala: "" };
const PLAN = { socioId: "socio-1", planId: "plan-1", fechaInicio: "2026-12-01" };
const PAGO = { socioId: "socio-1", membresiaId: "membresia-1", monto: "15000", medio: "EFECTIVO" };

const acciones = [
  { nombre: "programar una clase", rol: "PROFESOR", para: "profesores", correr: () => programarClaseAction(SIN_ENVIAR, formulario(CLASE)) },
  { nombre: "asignar un plan", rol: "ADMIN", para: "administración", correr: () => asignarMembresiaAction(SIN_ENVIAR, formulario(PLAN)) },
  { nombre: "registrar un pago", rol: "ADMIN", para: "administración", correr: () => registrarPagoAction(SIN_ENVIAR, formulario(PAGO)) },
] as const;

const nadaEscrito = () => {
  expect(mocks.programar).not.toHaveBeenCalled();
  expect(mocks.asignar).not.toHaveBeenCalled();
  expect(mocks.pagar).not.toHaveBeenCalled();
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.redirigir.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
});

describe.each(acciones)("$nombre", ({ rol, para, correr }) => {
  it(`exige el rol ${rol}: otro rol recibe el aviso y no se escribe nada`, async () => {
    mocks.usuario.mockRejectedValue(new NoAutorizado());
    expect(await correr()).toMatchObject({ estado: "ERROR", mensaje: expect.stringContaining(para) });
    expect(mocks.usuario).toHaveBeenCalledWith(rol);
    nadaEscrito();
  });

  it("sin sesión redirige a ingresar sin escribir", async () => {
    mocks.usuario.mockRejectedValue(new NoAutenticado());
    await expect(correr()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirigir).toHaveBeenCalledWith(expect.stringContaining("/ingresar?callbackUrl="));
    nadaEscrito();
  });
});

describe("programar una clase", () => {
  beforeEach(() => mocks.usuario.mockResolvedValue({ id: "profesor-de-sesion", rol: "PROFESOR" }));

  it("la clase queda a nombre del profesor de la sesión y se abre su detalle", async () => {
    mocks.programar.mockResolvedValue({ id: "clase-nueva" });
    await expect(programarClaseAction(SIN_ENVIAR, formulario({ ...CLASE, profesorId: "otro" }))).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.programar).toHaveBeenCalledWith("profesor-de-sesion", expect.objectContaining({ nombre: "Spinning", cupoMaximo: 20 }));
    expect(mocks.programar.mock.calls[0]![1]).not.toHaveProperty("profesorId");
    expect(mocks.revalidar).toHaveBeenCalledWith("/clases");
    expect(mocks.redirigir).toHaveBeenCalledWith("/clases/clase-nueva");
  });

  it("un dato inválido vuelve con el error en su campo y lo escrito, sin escribir", async () => {
    const estado = await programarClaseAction(SIN_ENVIAR, formulario({ ...CLASE, cupoMaximo: "0" }));
    expect(estado).toMatchObject({ estado: "ERROR", errores: { cupoMaximo: expect.any(Array) }, valores: { nombre: "Spinning", cupoMaximo: "0" } });
    nadaEscrito();
  });
});

describe("asignar un plan", () => {
  beforeEach(() => mocks.usuario.mockResolvedValue({ id: "admin-1", rol: "ADMIN" }));

  it("asigna, refresca el listado y el detalle, y vuelve al detalle del socio", async () => {
    mocks.asignar.mockResolvedValue({ ok: true, dato: { id: "membresia-1", fechaFin: new Date() } });
    await expect(asignarMembresiaAction(SIN_ENVIAR, formulario(PLAN))).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.asignar).toHaveBeenCalledWith({ socioId: "socio-1", planId: "plan-1", fechaInicio: new Date("2026-12-01T03:00:00.000Z") });
    expect(mocks.revalidar).toHaveBeenCalledWith("/socios");
    expect(mocks.revalidar).toHaveBeenCalledWith("/socios/socio-1");
    expect(mocks.redirigir).toHaveBeenCalledWith("/socios/socio-1?asignado=1");
  });

  it("un socio o un plan que no existe vuelve como aviso, sin redirigir", async () => {
    mocks.asignar.mockResolvedValue({ ok: false, tipo: "NO_ENCONTRADO", mensaje: "No encontramos a ese socio. Volvé a la lista de socios." });
    expect(await asignarMembresiaAction(SIN_ENVIAR, formulario(PLAN))).toMatchObject({ estado: "ERROR", mensaje: expect.stringContaining("socio") });
    expect(mocks.redirigir).not.toHaveBeenCalled();
  });
});

describe("registrar un pago", () => {
  beforeEach(() => mocks.usuario.mockResolvedValue({ id: "admin-1", rol: "ADMIN" }));

  it("EFECTIVO: avisa hasta cuándo quedó la membresía", async () => {
    mocks.pagar.mockResolvedValue({ ok: true, dato: { renovada: true, fechaFin: new Date("2027-01-01T03:00:00Z"), checkoutUrl: null } });
    const estado = await registrarPagoAction(SIN_ENVIAR, formulario(PAGO));
    expect(mocks.pagar).toHaveBeenCalledWith(expect.objectContaining({ membresiaId: "membresia-1", monto: 15000, medio: "EFECTIVO" }), expect.any(Date));
    expect(estado).toMatchObject({ estado: "EXITO", mensaje: expect.stringContaining("vence el") });
    expect(estado).not.toHaveProperty("enlace");
    expect(mocks.revalidar).toHaveBeenCalledWith("/socios/socio-1");
  });

  it("MP: devuelve el link de cobro para mandarle al socio", async () => {
    mocks.pagar.mockResolvedValue({ ok: true, dato: { renovada: false, fechaFin: new Date(), checkoutUrl: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=1" } });
    expect(await registrarPagoAction(SIN_ENVIAR, formulario({ ...PAGO, medio: "MP" }))).toMatchObject({
      estado: "EXITO", enlace: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=1",
    });
  });

  it("MP caído: dice qué hacer y conserva lo escrito", async () => {
    mocks.pagar.mockResolvedValue({ ok: false, tipo: "MERCADO_PAGO_NO_DISPONIBLE" });
    expect(await registrarPagoAction(SIN_ENVIAR, formulario({ ...PAGO, medio: "MP" }))).toMatchObject({
      estado: "ERROR", mensaje: "Mercado Pago no está disponible", valores: { medio: "MP", monto: "15000" },
    });
    expect(mocks.revalidar).not.toHaveBeenCalled();
  });

  it("membresía cancelada: el rechazo de la regla llega tal cual", async () => {
    mocks.pagar.mockResolvedValue({ ok: false, tipo: "CONFLICTO", veredicto: { ok: false, motivos: [{ codigo: "MEMBRESIA_CANCELADA", mensaje: "La membresía está cancelada: hay que crear una nueva." }] } });
    expect(await registrarPagoAction(SIN_ENVIAR, formulario(PAGO))).toMatchObject({ estado: "ERROR", mensaje: expect.stringContaining("cancelada") });
  });

  it("un monto inválido no llega al caso de uso", async () => {
    expect(await registrarPagoAction(SIN_ENVIAR, formulario({ ...PAGO, monto: "-5" }))).toMatchObject({ estado: "ERROR", errores: { monto: expect.any(Array) } });
    nadaEscrito();
  });
});
