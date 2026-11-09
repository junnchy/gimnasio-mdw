import { prisma } from "@/lib/db/client";

const LIMITE_POR_DEFECTO = 200;

/**
 * Los socios con su membresía actual y su última visita (ADMIN, pantalla
 * /socios). Quien llama verifica el rol.
 *
 * "Membresía actual" con el mismo criterio que `obtenerMembresiaActual` (H8):
 * la de `fechaFin` más lejana. El estado VENCIDA no viene de acá: se calcula
 * al leer con `estadoMembresiaVista` (ADR 0002).
 */
export async function listarSociosConMembresia(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.user.findMany({
    where: { rol: "SOCIO" },
    orderBy: { nombre: "asc" },
    take: limite,
    select: {
      id: true,
      nombre: true,
      email: true,
      membresias: {
        orderBy: { fechaFin: "desc" },
        take: 1,
        select: { estado: true, fechaFin: true, plan: { select: { nombre: true } } },
      },
      visitas: { orderBy: { ingresoAt: "desc" }, take: 1, select: { ingresoAt: true } },
    },
  });
}
