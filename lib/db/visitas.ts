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
  const inicioDelDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return prisma.visita.updateMany({ where: { estado: "ABIERTA", ingresoAt: { lt: inicioDelDia } }, data: { estado: "INCOMPLETA" } });
}

export function duracionDeVisita(visita: { ingresoAt: Date; egresoAt: Date | null; estado: string }) {
  return visita.estado === "CERRADA" && visita.egresoAt ? calcularDuracionMin(visita.ingresoAt, visita.egresoAt) : null;
}
