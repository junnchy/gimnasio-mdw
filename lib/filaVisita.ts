/**
 * Lo que la pantalla de ingresos (/visitas, ADMIN) muestra de cada visita.
 *
 * Objeto plano con el texto ya armado en la hora del gimnasio, igual que
 * `filaReserva.ts` y `filaClase.ts`. La duración no se guarda: la calcula
 * `duracionDeVisita` al leer (ADR 0003). Para quien sigue adentro se muestra
 * cuánto hace que entró, con el mismo cálculo.
 */
import { calcularDuracionMin, duracionDeVisita } from "@/lib/visita";
import type { EstadoVisita } from "@/lib/schemas/_common";
import { formatearFecha, formatearHora } from "@/lib/utils";

export type FilaVisita = {
  id: string;
  socio: string;
  email: string;
  fecha: string;
  ingreso: string;
  egreso: string | null;
  estado: EstadoVisita;
  /** Texto de la duración ("1 h 05 min") si salió; cuánto lleva adentro si sigue; null si quedó incompleta. */
  tiempo: string | null;
};

type VisitaConSocio = {
  id: string;
  ingresoAt: Date;
  egresoAt: Date | null;
  estado: EstadoVisita;
  socio: { nombre: string; email: string };
};

/** "45 min", "1 h", "1 h 05 min" */
export function formatearDuracion(minutos: number): string {
  if (minutos < 60) return `${Math.max(0, minutos)} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${String(resto).padStart(2, "0")} min`;
}

export function aFilaVisita(visita: VisitaConSocio, ahora: Date): FilaVisita {
  const duracion = duracionDeVisita(visita);
  const tiempo =
    duracion !== null
      ? formatearDuracion(duracion)
      : visita.estado === "ABIERTA"
        ? formatearDuracion(calcularDuracionMin(visita.ingresoAt, ahora))
        : null;
  return {
    id: visita.id,
    socio: visita.socio.nombre,
    email: visita.socio.email,
    fecha: formatearFecha(visita.ingresoAt),
    ingreso: formatearHora(visita.ingresoAt),
    egreso: visita.egresoAt ? formatearHora(visita.egresoAt) : null,
    estado: visita.estado,
    tiempo,
  };
}
