import { prisma } from "@/lib/db/client";
import { inicioDelDiaArgentina } from "@/lib/visita";

const LIMITE_POR_DEFECTO = 50;

export async function listarVisitasDeSocio(socioId: string, limite: number = LIMITE_POR_DEFECTO) {
  return prisma.visita.findMany({ where: { socioId }, take: limite, orderBy: { ingresoAt: "desc" } });
}

/** La visita ABIERTA del socio, si hay. El índice único parcial garantiza que sea una sola. */
export async function visitaAbiertaDelSocio(socioId: string) {
  return prisma.visita.findFirst({
    where: { socioId, estado: "ABIERTA" },
    select: { id: true, ingresoAt: true },
  });
}

/**
 * Último movimiento del socio (ingreso o egreso, el más reciente), que es lo
 * que mira el debounce de la H2.
 */
export async function ultimoMovimientoDelSocio(socioId: string): Promise<Date | null> {
  const visita = await prisma.visita.findFirst({
    where: { socioId },
    orderBy: { ingresoAt: "desc" },
    select: { ingresoAt: true, egresoAt: true },
  });
  if (!visita) return null;
  return visita.egresoAt && visita.egresoAt > visita.ingresoAt ? visita.egresoAt : visita.ingresoAt;
}

export async function abrirVisita(socioId: string, ahora: Date) {
  return prisma.visita.create({ data: { socioId, ingresoAt: ahora, estado: "ABIERTA" } });
}

export async function cerrarVisita(id: string, ahora: Date) {
  return prisma.visita.update({ where: { id }, data: { estado: "CERRADA", egresoAt: ahora } });
}

/** H3: las visitas que quedaron abiertas de días anteriores se marcan INCOMPLETA. */
export async function cerrarVisitasDelDia(ahora: Date) {
  return prisma.visita.updateMany({
    where: { estado: "ABIERTA", ingresoAt: { lt: inicioDelDiaArgentina(ahora) } },
    data: { estado: "INCOMPLETA" },
  });
}
