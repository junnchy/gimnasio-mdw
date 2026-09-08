import { prisma } from "@/lib/db/client";

const LIMITE_POR_DEFECTO = 50;

export async function listarReservasDeSocio(socioId: string, limite: number = LIMITE_POR_DEFECTO) {
  return prisma.reserva.findMany({
    where: { socioId }, take: limite, orderBy: { createdAt: "desc" },
    include: { clase: { include: { profesor: { select: { id: true, nombre: true } } } } },
  });
}

export async function crearReserva(claseId: string, socioId: string) {
  const clase = await prisma.clase.findUnique({ where: { id: claseId }, select: { id: true } });
  if (!clase) return null;
  return prisma.reserva.create({ data: { claseId, socioId } });
}

export async function obtenerReserva(id: string) {
  return prisma.reserva.findUnique({ where: { id }, include: { clase: true } });
}

export async function cancelarReserva(id: string, socioId: string) {
  const { count } = await prisma.reserva.updateMany({ where: { id, socioId, estado: "CONFIRMADA" }, data: { estado: "CANCELADA" } });
  return count > 0;
}

export async function marcarAsistencia(id: string, profesorId: string) {
  const { count } = await prisma.reserva.updateMany({
    where: { id, estado: "CONFIRMADA", clase: { profesorId } }, data: { presente: true },
  });
  return count > 0;
}
