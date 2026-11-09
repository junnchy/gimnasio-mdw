import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { exigirAdmin } from "@/lib/db/permisos";
import type { RolUsuario } from "@/lib/schemas/_common";
import { inicioDelDiaArgentina } from "@/lib/visita";

const LIMITE_POR_DEFECTO = 50;

export async function listarVisitasDeSocio(socioId: string, limite: number = LIMITE_POR_DEFECTO) {
  return prisma.visita.findMany({ where: { socioId }, take: limite, orderBy: { ingresoAt: "desc" } });
}

/** La visita ABIERTA del socio, si hay. El índice único parcial garantiza que sea una sola. */
export async function visitaAbiertaDelSocio(socioId: string, db: Prisma.TransactionClient = prisma) {
  return db.visita.findFirst({
    where: { socioId, estado: "ABIERTA" },
    select: { id: true, ingresoAt: true },
  });
}

/**
 * Último movimiento del socio (ingreso o egreso, el más reciente), que es lo
 * que mira el debounce de la H2.
 */
export async function ultimoMovimientoDelSocio(socioId: string, db: Prisma.TransactionClient = prisma): Promise<Date | null> {
  const visita = await db.visita.findFirst({
    where: { socioId },
    orderBy: { ingresoAt: "desc" },
    select: { ingresoAt: true, egresoAt: true },
  });
  if (!visita) return null;
  return visita.egresoAt && visita.egresoAt > visita.ingresoAt ? visita.egresoAt : visita.ingresoAt;
}

export async function abrirVisita(socioId: string, ahora: Date, db: Prisma.TransactionClient = prisma) {
  return db.visita.create({ data: { socioId, ingresoAt: ahora, estado: "ABIERTA" } });
}

export async function cerrarVisita(id: string, ahora: Date, db: Prisma.TransactionClient = prisma) {
  return db.visita.update({ where: { id }, data: { estado: "CERRADA", egresoAt: ahora } });
}

/** H3: las visitas que quedaron abiertas de días anteriores se marcan INCOMPLETA. */
export async function cerrarVisitasDelDia(ahora: Date) {
  return prisma.visita.updateMany({
    where: { estado: "ABIERTA", ingresoAt: { lt: inicioDelDiaArgentina(ahora) } },
    data: { estado: "INCOMPLETA" },
  });
}

/**
 * Para recepción (pantalla /visitas). Devuelven visitas de TODOS los socios,
 * así que reciben a quien pregunta y exigen ADMIN (`exigirAdmin`), además del
 * chequeo de la página. Solo se lee el nombre y el mail del socio.
 */
type Quien = { rol: RolUsuario };
const socioDeLaVisita = { socio: { select: { nombre: true, email: true } } } as const;
const LIMITE_ADENTRO = 100;

/**
 * Quién está adentro ahora: las visitas ABIERTAS, la más antigua primero.
 * Con tope: si el cierre diario (H3) fallara unos días, se acumularían.
 * El total real sale de `contarVisitasAbiertas`.
 */
export async function listarVisitasAbiertas(quien: Quien, limite: number = LIMITE_ADENTRO) {
  exigirAdmin(quien);
  return prisma.visita.findMany({ where: { estado: "ABIERTA" }, take: limite, orderBy: { ingresoAt: "asc" }, include: socioDeLaVisita });
}

export async function contarVisitasAbiertas(quien: Quien) {
  exigirAdmin(quien);
  return prisma.visita.count({ where: { estado: "ABIERTA" } });
}

/** Los últimos movimientos del gimnasio, el más reciente primero. */
export async function listarVisitasRecientes(quien: Quien, limite: number = LIMITE_POR_DEFECTO) {
  exigirAdmin(quien);
  return prisma.visita.findMany({ take: limite, orderBy: { ingresoAt: "desc" }, include: socioDeLaVisita });
}

/** Ingresos desde un momento (el inicio del día de Argentina, en la pantalla). */
export async function contarIngresosDesde(quien: Quien, desde: Date) {
  exigirAdmin(quien);
  return prisma.visita.count({ where: { ingresoAt: { gte: desde } } });
}
