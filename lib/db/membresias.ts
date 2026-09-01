import { prisma } from "@/lib/db/client";
import type { Membresia } from "@/lib/schemas/membresia";

export async function obtenerMembresiaActual(socioId: string) {
  return prisma.membresia.findFirst({ where: { socioId }, orderBy: { fechaFin: "desc" }, include: { plan: true } });
}

export async function crearMembresia(datos: Membresia) {
  const socio = await prisma.user.findUnique({ where: { id: datos.socioId }, select: { id: true } });
  const plan = await prisma.plan.findUnique({ where: { id: datos.planId }, select: { id: true } });
  if (!socio || !plan) return null;
  return prisma.membresia.create({ data: datos });
}
