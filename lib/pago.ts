/**
 * Reglas de negocio de pagos y renovación de membresía (H7 y spec §8).
 *
 * Funciones puras: sin Prisma, sin Next, sin `new Date()` adentro.
 */
import { veredicto, type Motivo, type Veredicto } from "@/lib/reglas";

export type MedioPago = "EFECTIVO" | "MP";
export type EstadoPago = "APROBADO" | "PENDIENTE" | "RECHAZADO";

export type CodigoRechazoPago = "MEMBRESIA_CANCELADA";

/**
 * El estado del pago lo decide el servidor, nunca el body del request.
 *
 * - EFECTIVO: lo registra el ADMIN con la plata en la mano, así que nace
 *   APROBADO. Es el camino manual de la spec §8 (si Mercado Pago se cae, el
 *   admin registra el pago para no bloquear el acceso del socio).
 * - MP: nace PENDIENTE. Lo aprueba el webhook de Mercado Pago, no quien llama.
 */
export function estadoInicialDePago(medio: MedioPago): EstadoPago {
  return medio === "EFECTIVO" ? "APROBADO" : "PENDIENTE";
}

/**
 * H7 — un pago APROBADO renueva la membresía; uno RECHAZADO deja constancia
 * del intento y no la activa.
 *
 * La nueva fecha de fin se cuenta desde el vencimiento vigente si todavía no
 * pasó (renovar no regala días), y desde hoy si ya venció.
 */
export function renovacionPorPago(
  datos: {
    readonly estadoPago: EstadoPago;
    readonly duracionDias: number;
    readonly fechaFinActual: Date;
  },
  ahora: Date,
): { readonly renueva: boolean; readonly nuevaFechaFin: Date | null } {
  if (datos.estadoPago !== "APROBADO") return { renueva: false, nuevaFechaFin: null };

  const base = datos.fechaFinActual > ahora ? datos.fechaFinActual : ahora;
  const nuevaFechaFin = new Date(base.getTime() + datos.duracionDias * 86_400_000);
  return { renueva: true, nuevaFechaFin };
}

/**
 * Una membresía CANCELADA es un hecho: no se reactiva registrando un pago,
 * hay que crear una membresía nueva (ADR 0002 — cancelar no lo pisa el tiempo).
 */
export function puedeRegistrarPago(
  datos: { readonly estadoMembresia: "ACTIVA" | "CANCELADA" },
): Veredicto<CodigoRechazoPago> {
  const motivos: Motivo<CodigoRechazoPago>[] = [];

  if (datos.estadoMembresia === "CANCELADA") {
    motivos.push({
      codigo: "MEMBRESIA_CANCELADA",
      mensaje: "La membresía está cancelada: hay que crear una nueva.",
    });
  }

  return veredicto(motivos);
}
