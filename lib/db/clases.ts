import { prisma } from "@/lib/db/client";
import type { Clase } from "@/lib/schemas/clase";

const LIMITE_POR_DEFECTO = 50;

export async function listarClases(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.clase.findMany({
    take: limite,
    orderBy: { inicio: "asc" },
    include: { profesor: { select: { id: true, nombre: true } }, _count: { select: { reservas: { where: { estado: "CONFIRMADA" } } } } },
  });
}

export async function crearClase(datos: Omit<Clase, "profesorId">, profesorId: string) {
  return prisma.clase.create({ data: { ...datos, profesorId } });
}

export async function obtenerClase(id: string) {
  return prisma.clase.findUnique({ where: { id }, include: { profesor: { select: { id: true, nombre: true } } } });
}

export async function actualizarClase(id: string, datos: Partial<Omit<Clase, "profesorId">>, profesorId: string) {
  const { count } = await prisma.clase.updateMany({ where: { id, profesorId }, data: datos });
  return count === 0 ? null : obtenerClase(id);
}
