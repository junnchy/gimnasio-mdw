import { prisma } from "@/lib/db/client";
import type { Ejercicio } from "@/lib/schemas/ejercicio";

const LIMITE_POR_DEFECTO = 50;

export async function listarEjercicios(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.ejercicio.findMany({ take: limite, orderBy: { nombre: "asc" } });
}

export async function crearEjercicio(datos: Ejercicio) {
  return prisma.ejercicio.create({ data: datos });
}
