import { prisma } from "@/lib/db/client";
import type { Membresia } from "@/lib/schemas/membresia";

/**
 * La membresía vigente del socio. Si tuviera varias, gana la de `fechaFin` más
 * lejana: es la regla de la H8 que la base no puede expresar, y vive acá para
 * que todas las pantallas elijan igual.
 */
export async function obtenerMembresiaActual(socioId: string) {
  return prisma.membresia.findFirst({ where: { socioId }, orderBy: { fechaFin: "desc" }, include: { plan: true } });
}

/** La membresía con la duración de su plan, que es lo que la H7 necesita para renovar. */
export async function obtenerMembresiaParaPago(id: string) {
  return prisma.membresia.findUnique({
    where: { id },
    select: { id: true, estado: true, fechaFin: true, plan: { select: { duracionDias: true } } },
  });
}

export async function crearMembresia(datos: Omit<Membresia, "estado">) {
  // Solo un SOCIO tiene membresía: el socioId viene del body del admin.
  const socio = await prisma.user.findFirst({ where: { id: datos.socioId, rol: "SOCIO" }, select: { id: true } });
  const plan = await prisma.plan.findUnique({ where: { id: datos.planId }, select: { id: true } });
  if (!socio || !plan) return null;
  return prisma.membresia.create({ data: { ...datos, estado: "ACTIVA" } });
}
