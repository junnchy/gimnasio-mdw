import { prisma } from "@/lib/db/client";
import type { RolUsuario } from "@/lib/schemas/_common";
import type { Clase } from "@/lib/schemas/clase";

const LIMITE_POR_DEFECTO = 50;

export async function listarClases(limite: number = LIMITE_POR_DEFECTO) {
  return prisma.clase.findMany({
    take: limite,
    orderBy: { inicio: "asc" },
    include: { profesor: { select: { id: true, nombre: true } }, _count: { select: { reservas: { where: { estado: "CONFIRMADA" } } } } },
  });
}

/**
 * Las clases que todavía no empezaron, la más próxima primero (clase 10: el
 * inicio de profesor y admin). Filtra en la base y no en la pantalla: con
 * `listarClases` y un filtro en memoria, 50 clases viejas dejarían la lista
 * vacía aunque hubiera clases mañana.
 */
export async function listarProximasClases(desde: Date, limite: number = LIMITE_POR_DEFECTO) {
  return prisma.clase.findMany({
    where: { inicio: { gte: desde } },
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

/**
 * Una clase con sus inscriptos (pantalla /clases/:id).
 *
 * El permiso vive en el WHERE, como desde la clase 6:
 *   ADMIN     cualquier clase
 *   PROFESOR  solo las que dicta; la de otro vuelve null, igual que una que
 *             no existe (la pantalla responde 404 en los dos casos)
 *   SOCIO     nunca: los datos de otros socios no son suyos
 *
 * Los inscriptos son las reservas CONFIRMADAS; de las canceladas solo se
 * cuenta cuántas hay.
 */
export async function obtenerClaseConInscriptos(id: string, usuario: { id: string; rol: RolUsuario }) {
  if (usuario.rol === "SOCIO") return null;
  return prisma.clase.findFirst({
    where: { id, ...(usuario.rol === "PROFESOR" ? { profesorId: usuario.id } : {}) },
    include: {
      profesor: { select: { id: true, nombre: true } },
      reservas: {
        where: { estado: "CONFIRMADA" },
        orderBy: { createdAt: "asc" },
        select: { id: true, presente: true, createdAt: true, socio: { select: { nombre: true, email: true } } },
      },
      _count: { select: { reservas: { where: { estado: "CANCELADA" } } } },
    },
  });
}
