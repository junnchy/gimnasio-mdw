import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { claseParaReservar, crearReserva, reservasVigentesDelSocio, obtenerReservaDeSocio, cancelarReserva } from "@/lib/db/reservas";
import { obtenerMembresiaActual } from "@/lib/db/membresias";
import { abrirVisita, cerrarVisita, visitaAbiertaDelSocio, ultimoMovimientoDelSocio } from "@/lib/db/visitas";

export class OperacionConcurrente extends Error {}

function repositorios(tx: Prisma.TransactionClient, socioId: string) {
  return {
    clase: (id: string) => claseParaReservar(id, tx),
    membresia: () => obtenerMembresiaActual(socioId, tx),
    reservas: (clase: { inicio: Date; duracionMin: number }) => reservasVigentesDelSocio(socioId, clase, tx),
    reservar: (claseId: string) => crearReserva(claseId, socioId, tx),
    reserva: (id: string) => obtenerReservaDeSocio(id, socioId, tx),
    cancelar: (id: string) => cancelarReserva(id, socioId, tx),
    visitaAbierta: () => visitaAbiertaDelSocio(socioId, tx),
    ultimoMovimiento: () => ultimoMovimientoDelSocio(socioId, tx),
    ingresar: (ahora: Date) => abrirVisita(socioId, ahora, tx),
    salir: (id: string, ahora: Date) => cerrarVisita(id, ahora, tx),
  };
}

export type DatosSocio = ReturnType<typeof repositorios>;

/** Repite TODA la lectura/regla/escritura, nunca solo la escritura fallida.
 * SERIALIZABLE protege cupos entre socios y solapamientos entre clases.
 * No hay HTTP ni revalidaciones dentro del callback: puede correrse tres veces.
 */
export async function operarSocio<T>(socioId: string, trabajo: (datos: DatosSocio) => Promise<T>): Promise<T> {
  for (let intento = 0; intento < 3; intento++) {
    try {
      return await prisma.$transaction((tx) => trabajo(repositorios(tx, socioId)), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 15000,
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      // P2028 es amplio: solo se reintenta si Prisma no llegó a iniciar la transacción.
      const noInicio = error.code === "P2028" && error.message.includes("Unable to start a transaction in the given time");
      if (error.code !== "P2034" && !noInicio) throw error;
    }
  }
  throw new OperacionConcurrente();
}
