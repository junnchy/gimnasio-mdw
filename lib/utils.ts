export async function leerBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export { cn } from "cn";

/**
 * Fechas para mostrar (clase 8): se formatean UNA vez, en el servidor y en la
 * zona del gimnasio, y a la pantalla llega texto. Vercel corre en UTC: sin
 * fijar la zona, una clase de las 22:00 aparecería al día siguiente.
 * Es la misma zona que usa `inicioDelDiaArgentina` (lib/visita.ts).
 */
const ZONA_HORARIA = "America/Argentina/Cordoba";

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_HORARIA,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const formatoHora = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_HORARIA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "martes, 13 de octubre" */
export function formatearFecha(fecha: Date): string {
  return formatoFecha.format(fecha);
}

/** "18:00" */
export function formatearHora(fecha: Date): string {
  return formatoHora.format(fecha);
}

const formatoMonto = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/** "$ 15.000,00" */
export function formatearMonto(monto: number): string {
  return formatoMonto.format(monto);
}

/**
 * Argentina no tiene horario de verano desde 2009: la zona del gimnasio es
 * UTC−3 todo el año. Los formularios mandan la hora "de pared" del gimnasio
 * (un `<input type="datetime-local">` no lleva zona), y el servidor corre en
 * UTC: sin esto, una clase de las 18:00 quedaría guardada a las 15:00.
 */
const DESFASE_ARGENTINA = "-03:00";

/** "2026-12-01T18:00" (hora del gimnasio) → el instante. Inválida → `Invalid Date`. */
export function fechaHoraArgentina(valor: string): Date {
  return new Date(`${valor}:00${DESFASE_ARGENTINA}`);
}

/** "2026-12-01" (día del gimnasio) → las 00:00 de ese día en Argentina. */
export function inicioDelDiaEnArgentina(valor: string): Date {
  return new Date(`${valor}T00:00:00${DESFASE_ARGENTINA}`);
}

/** El día de hoy en el gimnasio, como lo pide un `<input type="date">`: "2026-12-01". */
export function hoyEnArgentina(ahora: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(ahora);
}
