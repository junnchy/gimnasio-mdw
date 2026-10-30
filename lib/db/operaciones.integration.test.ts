import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/client";
import { reservarClase } from "@/lib/casos/reservarClase";
import { cancelarReservaPropia } from "@/lib/casos/cancelarReserva";
import { registrarEscaneo } from "@/lib/casos/registrarEscaneo";

const conexion = vi.hoisted(() => {
  const conexion = process.env.TEST_DATABASE_URL;
  if (conexion) {
    const url = new URL(conexion);
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/pulso_test") {
      throw new Error("Las pruebas requieren PostgreSQL local con nombre pulso_test.");
    }
    // Prisma captura el entorno al construirse: configurarlo ANTES de importar el cliente.
    vi.stubEnv("DATABASE_URL", conexion);
  }
  return conexion;
});

// Opt-in y solo loopback: jamás aceptar la base real para fixtures destructivos.
describe.skipIf(!conexion)("operaciones de socio contra PostgreSQL", () => {
  const prefijo = `clase12-${randomUUID()}`;
  const socioId = `${prefijo}-socio`;
  const otroId = `${prefijo}-otro`;
  const profesorId = `${prefijo}-profe`;
  const planId = `${prefijo}-plan`;
  const claseId = `${prefijo}-clase`;
  const token = "qr-local-solo-pruebas";
  let habilitada = false;

  beforeAll(() => {
    vi.stubEnv("QR_TOKEN", token);
    habilitada = true;
  });

  beforeEach(async () => {
    await prisma.user.createMany({ data: [
      { id: socioId, nombre: "Socio", email: `${socioId}@example.com`, rol: "SOCIO" },
      { id: otroId, nombre: "Otro", email: `${otroId}@example.com`, rol: "SOCIO" },
      { id: profesorId, nombre: "Profesor", email: `${profesorId}@example.com`, rol: "PROFESOR" },
    ] });
    await prisma.plan.create({ data: { id: planId, nombre: prefijo, precio: 1000, duracionDias: 30 } });
    await prisma.membresia.createMany({ data: [socioId, otroId].map((id) => ({
      socioId: id, planId, fechaInicio: new Date(Date.now() - 86400000), fechaFin: new Date(Date.now() + 86400000), estado: "ACTIVA" as const,
    })) });
    await prisma.clase.create({ data: {
      id: claseId, nombre: "Funcional", profesorId, cupoMaximo: 1, inicio: new Date(Date.now() + 86400000), duracionMin: 60,
    } });
  });

  afterEach(async () => {
    if (!habilitada) return;
    // Solo registros de este grupo; no borra tablas ni corre el seed del proyecto.
    await prisma.reserva.deleteMany({ where: { socioId: { in: [socioId, otroId] } } });
    await prisma.visita.deleteMany({ where: { socioId: { in: [socioId, otroId] } } });
    await prisma.membresia.deleteMany({ where: { planId } });
    await prisma.clase.deleteMany({ where: { profesorId } });
    await prisma.plan.deleteMany({ where: { id: planId } });
    await prisma.user.deleteMany({ where: { id: { in: [socioId, otroId, profesorId] } } });
  });

  afterAll(async () => { await prisma.$disconnect(); vi.unstubAllEnvs(); });

  it("dos socios por el último cupo: solo uno reserva", async () => {
    const resultados = await Promise.all([reservarClase(socioId, claseId), reservarClase(otroId, claseId)]);
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
    expect(await prisma.reserva.count({ where: { claseId, estado: "CONFIRMADA" } })).toBe(1);
    expect(resultados.find((r) => !r.ok)).toMatchObject({ tipo: "CONFLICTO" });
  });

  it("dos clases solapadas del mismo socio: solo una reserva", async () => {
    const otra = await prisma.clase.create({ data: {
      nombre: "Otra clase", profesorId, cupoMaximo: 10, inicio: new Date(Date.now() + 86400000), duracionMin: 60,
    } });
    const resultados = await Promise.all([reservarClase(socioId, claseId), reservarClase(socioId, otra.id)]);
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
    expect(await prisma.reserva.count({ where: { socioId, estado: "CONFIRMADA" } })).toBe(1);
  });

  it("reserva, rechaza duplicado, protege recurso ajeno, cancela y libera cupo", async () => {
    const creada = await reservarClase(socioId, claseId);
    expect(creada.ok).toBe(true);
    if (!creada.ok) throw new Error("No creó la reserva");
    expect((await reservarClase(socioId, claseId)).ok).toBe(false);
    expect(await cancelarReservaPropia(otroId, creada.dato.id)).toMatchObject({ tipo: "NO_ENCONTRADO" });
    expect((await cancelarReservaPropia(socioId, creada.dato.id)).ok).toBe(true);
    expect(await cancelarReservaPropia(socioId, creada.dato.id)).toMatchObject({ tipo: "CONFLICTO" });
    expect((await reservarClase(otroId, claseId)).ok).toBe(true);
  });

  it("rechaza membresía vencida, clase iniciada y reserva inexistente", async () => {
    await prisma.membresia.updateMany({ where: { socioId }, data: { fechaFin: new Date(Date.now() - 1000) } });
    expect(await reservarClase(socioId, claseId)).toMatchObject({ motivos: expect.arrayContaining([expect.objectContaining({ codigo: "MEMBRESIA_INACTIVA" })]) });
    await prisma.clase.update({ where: { id: claseId }, data: { inicio: new Date(Date.now() - 1000) } });
    expect(await reservarClase(otroId, claseId)).toMatchObject({ motivos: expect.arrayContaining([expect.objectContaining({ codigo: "CLASE_YA_INICIADA" })]) });
    expect(await cancelarReservaPropia(socioId, "no-existe")).toMatchObject({ tipo: "NO_ENCONTRADO" });
  });

  it("dos escaneos simultáneos abren una sola visita; el siguiente respeta debounce", async () => {
    const resultados = await Promise.all([registrarEscaneo(socioId, token), registrarEscaneo(socioId, token)]);
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
    expect(await prisma.visita.count({ where: { socioId, estado: "ABIERTA" } })).toBe(1);
    expect(await registrarEscaneo(socioId, token)).toMatchObject({ motivos: expect.arrayContaining([expect.objectContaining({ codigo: "ESCANEO_DUPLICADO" })]) });
  });

  it("dos salidas simultáneas cierran una vez sin cambiar la duración otra vez", async () => {
    await prisma.visita.create({ data: { socioId, ingresoAt: new Date(Date.now() - 120000), estado: "ABIERTA" } });
    const resultados = await Promise.all([registrarEscaneo(socioId, token), registrarEscaneo(socioId, token)]);
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
    expect(await prisma.visita.count({ where: { socioId } })).toBe(1);
    expect(await prisma.visita.findFirst({ where: { socioId } })).toMatchObject({ estado: "CERRADA" });
  });

  it("rechaza QR inválido e ingreso vencido, pero permite salir con cuota vencida", async () => {
    expect((await registrarEscaneo(socioId, "token-equivocado")).ok).toBe(false);
    await prisma.membresia.updateMany({ where: { socioId }, data: { fechaFin: new Date(Date.now() - 1000) } });
    expect((await registrarEscaneo(socioId, token)).ok).toBe(false);
    expect(await prisma.visita.count({ where: { socioId } })).toBe(0);
    await prisma.visita.create({ data: { socioId, ingresoAt: new Date(Date.now() - 120000), estado: "ABIERTA" } });
    expect(await registrarEscaneo(socioId, token)).toMatchObject({ ok: true, dato: { estado: "CERRADA", duracionMin: 2 } });
  });
});
