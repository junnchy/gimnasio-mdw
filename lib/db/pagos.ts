import { prisma } from "@/lib/db/client";
import {
  estadoInicialDePago,
  puedeRegistrarPago,
  renovacionPorPago,
  transicionPorMercadoPago,
  type EstadoPago,
  type MedioPago,
} from "@/lib/pago";
import type { EstadoMercadoPago } from "@/lib/schemas/mercadoPago";
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

export type ResultadoNotificacion =
  | { readonly resultado: "NO_ENCONTRADO" }
  | { readonly resultado: "SIN_CAMBIOS"; readonly estado: EstadoPago }
  | { readonly resultado: "ACTUALIZADO"; readonly estado: EstadoPago; readonly renovada: boolean };

/**
 * Webhook de Mercado Pago — aplica el estado real informado por Mercado Pago
 * al Pago `pagoId` y, si queda APROBADO, renueva la membresía. Todo en una
 * transacción, por la misma razón que `registrarPago`.
 *
 * Idempotente: Mercado Pago reenvía la misma notificación varias veces, a
 * veces en paralelo. El `updateMany` con `estado: "PENDIENTE"` en el `where`
 * es el candado: si dos notificaciones llegan juntas, solo una encuentra el
 * pago PENDIENTE (count = 1) y renueva; la otra ve count = 0 y no hace nada.
 * Leer el estado y después escribir, sin esa condición, renovaría dos veces.
 */
export async function aplicarEstadoDeMercadoPago(
  pagoId: string,
  datos: { idPagoMercadoPago: string; estadoMercadoPago: EstadoMercadoPago },
  ahora: Date,
): Promise<ResultadoNotificacion> {
  return prisma.$transaction(async (tx) => {
    const pago = await tx.pago.findUnique({
      where: { id: pagoId },
      select: {
        medio: true,
        estado: true,
        membresia: { select: { id: true, estado: true, fechaFin: true, plan: { select: { duracionDias: true } } } },
      },
    });
    if (!pago) return { resultado: "NO_ENCONTRADO" };

    const nuevoEstado = transicionPorMercadoPago({
      medio: pago.medio,
      estadoActual: pago.estado,
      estadoMercadoPago: datos.estadoMercadoPago,
    });
    if (!nuevoEstado) return { resultado: "SIN_CAMBIOS", estado: pago.estado };

    const { count } = await tx.pago.updateMany({
      where: { id: pagoId, estado: "PENDIENTE" },
      data: { estado: nuevoEstado, refExterna: datos.idPagoMercadoPago },
    });
    if (count === 0) return { resultado: "SIN_CAMBIOS", estado: pago.estado };

    // Una membresía CANCELADA no se reactiva con un pago (ADR 0002), aunque el
    // pago haya entrado: queda APROBADO como constancia y no se renueva.
    const { membresia } = pago;
    const renovacion = renovacionPorPago(
      { estadoPago: nuevoEstado, duracionDias: membresia.plan.duracionDias, fechaFinActual: membresia.fechaFin },
      ahora,
    );
    if (!renovacion.nuevaFechaFin || !puedeRegistrarPago({ estadoMembresia: membresia.estado }).ok) {
      return { resultado: "ACTUALIZADO", estado: nuevoEstado, renovada: false };
    }

    await tx.membresia.update({
      where: { id: membresia.id },
      data: { fechaFin: renovacion.nuevaFechaFin, estado: "ACTIVA" },
    });
    return { resultado: "ACTUALIZADO", estado: nuevoEstado, renovada: true };
  });
}
