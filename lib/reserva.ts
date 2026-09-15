/**
 * Reglas de negocio de reservas y asistencia (H4, H5, H6 de `docs/spec.md`).
 *
 * Funciones puras: no importan Prisma ni Next, no escriben nada y no leen el
 * reloj — `ahora` entra siempre por parámetro. Cada motivo de rechazo está
 * trazado al criterio de aceptación que lo pide, y su mensaje es el mismo que
 * figura en el catálogo de errores de `docs/api.md`.
 */
import { membresiaHabilita, type EstadoMembresiaVista } from "@/lib/membresia";
import { veredicto, type Motivo, type Veredicto } from "@/lib/reglas";

export type EstadoReserva = "CONFIRMADA" | "CANCELADA";

/** La clase que se quiere reservar, con su ocupación ya contada. */
export type ClaseParaReservar = {
  readonly nombre: string;
  readonly inicio: Date;
  readonly duracionMin: number;
  readonly cupoMaximo: number;
  /** Reservas CONFIRMADAS: las CANCELADAS liberan cupo (spec §6). */
  readonly reservasConfirmadas: number;
};

/** Una reserva CONFIRMADA que el socio ya tiene, para detectar solapamiento. */
export type ReservaVigente = {
  readonly claseNombre: string;
  readonly inicio: Date;
  readonly duracionMin: number;
};

export type CodigoRechazoReserva =
  | "MEMBRESIA_INACTIVA"
  | "SIN_CUPO"
  | "HORARIO_SOLAPADO"
  | "CLASE_YA_INICIADA";

export type CodigoRechazoCancelacion = "RESERVA_NO_CONFIRMADA" | "CLASE_YA_INICIADA";

export type CodigoRechazoAsistencia = "RESERVA_NO_CONFIRMADA" | "CLASE_NO_DICTADA";

/** Cupo libre. spec §6: nunca puede quedar negativo. */
export function cuposDisponibles(clase: Pick<ClaseParaReservar, "cupoMaximo" | "reservasConfirmadas">): number {
  return Math.max(0, clase.cupoMaximo - clase.reservasConfirmadas);
}

export function finDeClase(inicio: Date, duracionMin: number): Date {
  return new Date(inicio.getTime() + duracionMin * 60_000);
}

/**
 * Dos franjas se solapan si cada una empieza antes de que termine la otra.
 * Pegadas no se solapan: una clase que termina 10:00 y otra que empieza 10:00
 * conviven (borde cubierto por test).
 */
export function seSolapan(
  a: { inicio: Date; duracionMin: number },
  b: { inicio: Date; duracionMin: number },
): boolean {
  return a.inicio < finDeClase(b.inicio, b.duracionMin) && b.inicio < finDeClase(a.inicio, a.duracionMin);
}

/**
 * H4 — Reservar una clase.
 * Criterios: membresía ACTIVA + cupo disponible + sin otra reserva en el mismo
 * horario. `CLASE_YA_INICIADA` se deriva de H5 ("reserva CONFIRMADA a futuro"):
 * si no se puede cancelar una clase que empezó, tampoco tiene sentido reservarla.
 */
export function puedeReservar(
  datos: {
    readonly estadoMembresia: EstadoMembresiaVista | null;
    readonly clase: ClaseParaReservar;
    readonly reservasVigentes: readonly ReservaVigente[];
  },
  ahora: Date,
): Veredicto<CodigoRechazoReserva> {
  const motivos: Motivo<CodigoRechazoReserva>[] = [];

  if (!membresiaHabilita(datos.estadoMembresia)) {
    motivos.push({
      codigo: "MEMBRESIA_INACTIVA",
      mensaje: "Tu membresía no está activa: no podés reservar clases.",
      datos: { estadoMembresia: datos.estadoMembresia },
    });
  }

  if (datos.clase.inicio <= ahora) {
    motivos.push({
      codigo: "CLASE_YA_INICIADA",
      mensaje: "La clase ya empezó: no se puede reservar.",
      datos: { inicio: datos.clase.inicio.toISOString() },
    });
  }

  if (cuposDisponibles(datos.clase) === 0) {
    motivos.push({
      codigo: "SIN_CUPO",
      mensaje: "Sin cupo disponible.",
      datos: { cupoMaximo: datos.clase.cupoMaximo, reservasConfirmadas: datos.clase.reservasConfirmadas },
    });
  }

  const solapadas = datos.reservasVigentes
    .filter((reserva) => seSolapan(reserva, datos.clase))
    .map((reserva) => reserva.claseNombre);

  if (solapadas.length > 0) {
    motivos.push({
      codigo: "HORARIO_SOLAPADO",
      mensaje: `Ya tenés una reserva en ese horario: ${solapadas.join(", ")}.`,
      datos: { clases: solapadas },
    });
  }

  return veredicto(motivos);
}

/**
 * H5 — Cancelar una reserva.
 * Criterio: "Dado una reserva CONFIRMADA a futuro". Las dos condiciones del
 * criterio son los dos motivos posibles de rechazo.
 */
export function puedeCancelar(
  datos: { readonly estado: EstadoReserva; readonly claseInicio: Date },
  ahora: Date,
): Veredicto<CodigoRechazoCancelacion> {
  const motivos: Motivo<CodigoRechazoCancelacion>[] = [];

  if (datos.estado !== "CONFIRMADA") {
    motivos.push({
      codigo: "RESERVA_NO_CONFIRMADA",
      mensaje: "La reserva no está confirmada.",
      datos: { estado: datos.estado },
    });
  }

  if (datos.claseInicio <= ahora) {
    motivos.push({
      codigo: "CLASE_YA_INICIADA",
      mensaje: "La clase ya empezó: no se puede cancelar.",
      datos: { inicio: datos.claseInicio.toISOString() },
    });
  }

  return veredicto(motivos);
}

/**
 * H6 — Marcar asistencia.
 * Criterios: reserva CONFIRMADA (el caso de error es la CANCELADA) y clase
 * "ya dictada", es decir que haya terminado: inicio + duracionMin <= ahora.
 */
export function puedeMarcarAsistencia(
  datos: {
    readonly estado: EstadoReserva;
    readonly claseInicio: Date;
    readonly claseDuracionMin: number;
  },
  ahora: Date,
): Veredicto<CodigoRechazoAsistencia> {
  const motivos: Motivo<CodigoRechazoAsistencia>[] = [];

  if (datos.estado !== "CONFIRMADA") {
    motivos.push({
      codigo: "RESERVA_NO_CONFIRMADA",
      mensaje: "No se puede marcar asistencia sobre una reserva cancelada.",
      datos: { estado: datos.estado },
    });
  }

  const fin = finDeClase(datos.claseInicio, datos.claseDuracionMin);
  if (ahora < fin) {
    motivos.push({
      codigo: "CLASE_NO_DICTADA",
      mensaje: "La clase todavía no terminó: no se puede marcar asistencia.",
      datos: { finEstimado: fin.toISOString() },
    });
  }

  return veredicto(motivos);
}
