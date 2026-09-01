import { prisma } from "@/lib/db/client";
import type { Rutina } from "@/lib/schemas/rutina";
import type { RutinaEjercicio } from "@/lib/schemas/rutinaEjercicio";

const LIMITE_POR_DEFECTO = 50;

export async function listarRutinasDeSocio(socioId: string, limite: number = LIMITE_POR_DEFECTO) {
  return prisma.rutina.findMany({ where: { socioId }, take: limite, orderBy: { updatedAt: "desc" }, include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: "asc" } } } });
}

export async function crearRutina(datos: Omit<Rutina, "profesorId">, profesorId: string) {
  const socio = await prisma.user.findUnique({ where: { id: datos.socioId }, select: { id: true } });
  if (!socio) return null;
  return prisma.rutina.create({ data: { ...datos, profesorId } });
}

export async function actualizarRutina(id: string, datos: Partial<Omit<Rutina, "profesorId" | "socioId">>, profesorId: string) {
  const { count } = await prisma.rutina.updateMany({ where: { id, profesorId }, data: datos });
  return count > 0 ? prisma.rutina.findUnique({ where: { id } }) : null;
}

export async function agregarEjercicioARutina(datos: RutinaEjercicio, profesorId: string) {
  const rutina = await prisma.rutina.findFirst({ where: { id: datos.rutinaId, profesorId }, select: { id: true } });
  const ejercicio = await prisma.ejercicio.findUnique({ where: { id: datos.ejercicioId }, select: { id: true } });
  if (!rutina || !ejercicio) return null;
  return prisma.rutinaEjercicio.create({ data: datos });
}
