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
