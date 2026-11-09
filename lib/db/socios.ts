import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { exigirAdmin } from "@/lib/db/permisos";
import type { RolUsuario } from "@/lib/schemas/_common";

export const LIMITE_SOCIOS = 200;

/**
 * Los socios con su membresía actual y su última visita (pantalla /socios).
 * Exige ADMIN además del chequeo de la página: son datos de todos los socios.
 *
 * Con límite (AGENTS.md) y con el TOTAL al lado: si hay más socios que el
 * límite, la pantalla lo dice y ofrece buscar, en vez de mostrar un recorte
 * como si fuera todo. `busqueda` filtra por nombre o mail, sin distinguir
 * mayúsculas.
 *
 * "Membresía actual" con el mismo criterio que `obtenerMembresiaActual` (H8):
 * la de `fechaFin` más lejana. VENCIDA no viene de acá: se calcula al leer con
 * `estadoMembresiaVista` (ADR 0002).
 */
export async function listarSociosConMembresia(
  quien: { rol: RolUsuario },
  { busqueda, limite = LIMITE_SOCIOS }: { busqueda?: string; limite?: number } = {},
) {
  exigirAdmin(quien);
  const where: Prisma.UserWhereInput = {
    rol: "SOCIO",
    ...(busqueda
      ? { OR: [{ nombre: { contains: busqueda, mode: "insensitive" } }, { email: { contains: busqueda, mode: "insensitive" } }] }
      : {}),
  };
  const [socios, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
    }),
    prisma.user.count({ where }),
  ]);
  return { socios, total };
}
