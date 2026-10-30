import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";

const LIMITE_POR_DEFECTO = 50;

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
export async function claseParaReservar(claseId: string, db: Prisma.TransactionClient = prisma) {
  const clase = await db.clase.findUnique({
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

/** Una sola coincidencia alcanza para rechazar el solapamiento (H4).
 * La comparación se hace en PostgreSQL para no truncar resultados por paginación.
 */
export async function reservasVigentesDelSocio(socioId: string, clase: { inicio: Date; duracionMin: number }, db: Prisma.TransactionClient = prisma) {
  const fin = new Date(clase.inicio.getTime() + clase.duracionMin * 60_000);
  return db.$queryRaw<{ claseNombre: string; inicio: Date; duracionMin: number }[]>`
    SELECT c.nombre AS "claseNombre", c.inicio, c."duracionMin"
    FROM "Reserva" r JOIN "Clase" c ON c.id = r."claseId"
    WHERE r."socioId" = ${socioId} AND r.estado = 'CONFIRMADA'
      AND c.inicio < ${fin}
      AND c.inicio + c."duracionMin" * interval '1 minute' > ${clase.inicio}
    LIMIT 1
  `;
}

export async function crearReserva(claseId: string, socioId: string, db: Prisma.TransactionClient = prisma) {
  return db.reserva.create({ data: { claseId, socioId } });
}

/**
 * La reserva, solo si es de ese socio (clase 6: el id de la sesión va en el
 * WHERE). Una reserva ajena devuelve null igual que una inexistente, y el
 * handler responde 404 en los dos casos: no se confirma que el id existe.
 */
export async function obtenerReservaDeSocio(id: string, socioId: string, db: Prisma.TransactionClient = prisma) {
  return db.reserva.findFirst({ where: { id, socioId }, include: { clase: true } });
}

/**
 * Para marcar asistencia: el profesor tiene que poder ver la reserva de un
 * socio para saber si la clase es suya (403) o si la reserva no existe (404).
 * El permiso lo vuelve a exigir `marcarAsistencia` en su propio WHERE.
 */
export async function obtenerReserva(id: string) {
  return prisma.reserva.findUnique({ where: { id }, include: { clase: true } });
}

export async function cancelarReserva(id: string, socioId: string, db: Prisma.TransactionClient = prisma) {
  const { count } = await db.reserva.updateMany({
    where: { id, socioId, estado: "CONFIRMADA" },
    data: { estado: "CANCELADA" },
  });
  return count === 0 ? null : db.reserva.findUnique({ where: { id } });
}

export async function marcarAsistencia(id: string, profesorId: string) {
  const { count } = await prisma.reserva.updateMany({
    where: { id, estado: "CONFIRMADA", clase: { profesorId } },
    data: { presente: true },
  });
  return count === 0 ? null : prisma.reserva.findUnique({ where: { id } });
}
