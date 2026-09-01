import { prisma } from "@/lib/db/client";
import type { Plan } from "@/lib/schemas/plan";

const LIMITE_POR_DEFECTO = 50;

export async function listarPlanes(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.plan.findMany({
    take: limite,
    orderBy: { creadoEn: "desc" },
  });
}

export async function crearPlan(datos: Plan) {
  return prisma.plan.create({ data: datos });
}
