import { prisma } from "@/lib/db/client";

const LIMITE_POR_DEFECTO = 50;
const LIMITE_RESERVAS_VIGENTES = 100;

export async function listarReservasDeSocio(socioId: string, limite: number = LIMITE_POR_DEFECTO) {
  return prisma.reserva.findMany({
    where: { socioId }, take: limite, orderBy: { createdAt: "desc" },
    include: { clase: { include: { profesor: { select: { id: true, nombre: true } } } } },
  });
}

/**
 * La clase con su ocupación, tal como la necesita `puedeReservar`: solo se
 * cuentan las reservas CONFIRMADAS, porque una CANCELADA libera cupo (spec §6).
 */
export async function claseParaReservar(claseId: string) {
  const clase = await prisma.clase.findUnique({
    where: { id: claseId },
    select: {
      id: true, nombre: true, inicio: true, duracionMin: true, cupoMaximo: true,
      _count: { select: { reservas: { where: { estado: "CONFIRMADA" } } } },
    },
  });
  if (!clase) return null;
  return {
    id: clase.id,
    nombre: clase.nombre,
    inicio: clase.inicio,
    duracionMin: clase.duracionMin,
    cupoMaximo: clase.cupoMaximo,
    reservasConfirmadas: clase._count.reservas,
  };
}

/** Las reservas CONFIRMADAS del socio, para detectar solapamiento de horario (H4). */
export async function reservasVigentesDelSocio(socioId: string) {
  const reservas = await prisma.reserva.findMany({
    where: { socioId, estado: "CONFIRMADA" },
    take: LIMITE_RESERVAS_VIGENTES,
    select: { clase: { select: { nombre: true, inicio: true, duracionMin: true } } },
  });
  return reservas.map(({ clase }) => ({
    claseNombre: clase.nombre,
    inicio: clase.inicio,
    duracionMin: clase.duracionMin,
  }));
}

export async function crearReserva(claseId: string, socioId: string) {
  return prisma.reserva.create({ data: { claseId, socioId } });
}

export async function obtenerReserva(id: string) {
  return prisma.reserva.findUnique({ where: { id }, include: { clase: true } });
}

export async function cancelarReserva(id: string) {
  return prisma.reserva.update({ where: { id }, data: { estado: "CANCELADA" } });
}

export async function marcarAsistencia(id: string) {
  return prisma.reserva.update({ where: { id }, data: { presente: true } });
}
