import { prisma } from "@/lib/db/client";
import { calcularDuracionMin } from "@/lib/visita";

const LIMITE_POR_DEFECTO = 50;

export async function listarVisitasDeSocio(socioId: string, limite: number = LIMITE_POR_DEFECTO) {
  return prisma.visita.findMany({ where: { socioId }, take: limite, orderBy: { ingresoAt: "desc" } });
}

export async function registrarEscaneo(socioId: string, ahora: Date = new Date()) {
  const abierta = await prisma.visita.findFirst({ where: { socioId, estado: "ABIERTA" }, orderBy: { ingresoAt: "desc" } });
  if (!abierta) return prisma.visita.create({ data: { socioId, ingresoAt: ahora, estado: "ABIERTA" } });
  return prisma.visita.update({
    where: { id: abierta.id },
    data: { estado: "CERRADA", egresoAt: ahora },
  });
}

export async function cerrarVisitasDelDia(ahora: Date = new Date()) {
  const inicioDelDia = inicioDelDiaArgentina(ahora);
  return prisma.visita.updateMany({ where: { estado: "ABIERTA", ingresoAt: { lt: inicioDelDia } }, data: { estado: "INCOMPLETA" } });
}

export function inicioDelDiaArgentina(ahora: Date): Date {
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const fecha = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  // Argentina mantiene UTC-3; así el cierre no depende del timezone de Vercel.
  return new Date(Date.UTC(Number(fecha.year), Number(fecha.month) - 1, Number(fecha.day), 3));
}

export function duracionDeVisita(visita: { ingresoAt: Date; egresoAt: Date | null; estado: string }) {
  return visita.estado === "CERRADA" && visita.egresoAt ? calcularDuracionMin(visita.ingresoAt, visita.egresoAt) : null;
}
