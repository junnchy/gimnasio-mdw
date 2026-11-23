/**
 * Regla de negocio del ADR 0002: el estado VENCIDA de la membresía se calcula,
 * no se guarda.
 *
 * La base guarda solo los hechos (`ACTIVA`/`CANCELADA`). VENCIDA se deriva al
 * leer, comparando `fechaFin` con el momento actual (spec §6, H8).
 *
 * Precedencia: una membresía CANCELADA es CANCELADA aunque su `fechaFin` ya
 * haya pasado — cancelar es un acto que alguien realizó; VENCIDA es una
 * conclusión del paso del tiempo, y no pisa un hecho.
 *
 * Es la ÚNICA función que decide este estado: todas las pantallas (H8, y los
 * rechazos de H1/H4) la usan, para no tener tres versiones distintas.
 *
 * `ahora` es un parámetro obligatorio: una función de reglas no lee el reloj
 * (regla de la clase 5), así queda testeable sin congelar el tiempo.
 */
import type { EstadoMembresia } from "@/lib/schemas/_common";

export type EstadoMembresiaVista = EstadoMembresia | "VENCIDA";

export function estadoMembresiaVista(
  m: { estado: EstadoMembresia; fechaFin: Date },
  ahora: Date,
): EstadoMembresiaVista {
  if (m.estado === "CANCELADA") return "CANCELADA";
  return m.fechaFin < ahora ? "VENCIDA" : "ACTIVA";
}

/**
 * spec §6: "Solo socios con membresía ACTIVA pueden reservar clases y registrar
 * ingreso". Un socio sin ninguna membresía (null) tampoco está habilitado.
 */
export function membresiaHabilita(estado: EstadoMembresiaVista | null): boolean {
  return estado === "ACTIVA";
}

const DIA = 86_400_000;

/**
 * Asignar un plan (/socios/:id): la membresía cubre `duracionDias` desde el
 * día de inicio. La calcula el servidor con la duración del plan, así
 * recepción no puede cargar un período distinto del que se cobra.
 */
export function calcularFechaFin(fechaInicio: Date, duracionDias: number): Date {
  return new Date(fechaInicio.getTime() + duracionDias * DIA);
}

/**
 * Lo que la pantalla de un socio ofrece: asignar un plan si no tiene una
 * membresía ACTIVA (ninguna, o la actual está CANCELADA), o cobrar si la
 * tiene, aunque esté vencida (H7: el pago la renueva). Es la misma regla que
 * hace cumplir el índice `Membresia_socio_activa_key`: con una ACTIVA, otra
 * alta se rechaza.
 */
export function puedeAsignarPlan(estado: EstadoMembresiaVista | null): boolean {
  return estado === null || estado === "CANCELADA";
}
