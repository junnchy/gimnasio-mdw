import { prisma } from "@/lib/db/client";
import { estadoInicialDePago, renovacionPorPago, type MedioPago } from "@/lib/pago";
import type { Pago } from "@/lib/schemas/pago";

export type DatosPago = Omit<Pago, "estado"> & { medio: MedioPago };

/**
 * H7 — registra el pago y, si queda APROBADO, renueva la membresía **en la
 * misma transacción**: o se guardan las dos cosas o ninguna. Si el pago se
 * registrara y la renovación fallara, el socio pagaría y seguiría vencido.
 *
 * Las decisiones (qué estado nace el pago, hasta cuándo se extiende la
 * membresía) las toman las funciones puras de `lib/pago.ts`; acá solo se
 * ejecutan contra la base.
 */
export async function registrarPago(
  datos: DatosPago,
  membresia: { id: string; fechaFin: Date; plan: { duracionDias: number } },
  ahora: Date,
) {
  const estado = estadoInicialDePago(datos.medio);
  const renovacion = renovacionPorPago(
    { estadoPago: estado, duracionDias: membresia.plan.duracionDias, fechaFinActual: membresia.fechaFin },
    ahora,
  );

  return prisma.$transaction(async (tx) => {
    const pago = await tx.pago.create({ data: { ...datos, estado } });

    if (!renovacion.renueva || !renovacion.nuevaFechaFin) {
      return { pago, renovada: false, fechaFin: membresia.fechaFin };
    }

    const actualizada = await tx.membresia.update({
      where: { id: membresia.id },
      data: { fechaFin: renovacion.nuevaFechaFin, estado: "ACTIVA" },
      select: { fechaFin: true },
    });

    return { pago, renovada: true, fechaFin: actualizada.fechaFin };
  });
}
