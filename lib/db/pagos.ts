import { prisma } from "@/lib/db/client";
import type { Pago } from "@/lib/schemas/pago";

export async function crearPago(datos: Pago) {
  const membresia = await prisma.membresia.findUnique({ where: { id: datos.membresiaId }, select: { id: true } });
  if (!membresia) return null;
  return prisma.pago.create({ data: datos });
}
