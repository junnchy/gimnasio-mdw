/**
 * Lo que las pantallas de reservas necesitan de cada reserva (clase 8).
 *
 * La fila cruza la frontera "use client" (components/filtro-reservas.tsx),
 * así que es un objeto plano: solo strings y booleanos. Las fechas viajan ya
 * formateadas en la zona del gimnasio; si viajara el `Date`, el servidor (UTC)
 * y el navegador podrían mostrar días distintos y React avisaría de un error
 * de hidratación.
 *
 * Este archivo lo importa un componente de cliente: no puede importar Prisma,
 * Auth.js ni nada de `lib/db/` (todo eso viajaría al navegador).
 */
import type { EstadoReserva } from "@/lib/schemas/_common";
import { formatearFecha, formatearHora } from "@/lib/utils";

export type FilaReserva = {
  id: string;
  clase: string;
  fecha: string;
  horario: string;
  sala: string | null;
  estado: EstadoReserva;
  presente: boolean;
};

/** La forma mínima que devuelven `listarReservasDeSocio` y `obtenerReservaDeSocio`. */
type ReservaConClase = {
  id: string;
  estado: EstadoReserva;
  presente: boolean;
  clase: { nombre: string; inicio: Date; duracionMin: number; sala: string | null };
};

export function aFilaReserva(reserva: ReservaConClase): FilaReserva {
  const { clase } = reserva;
  const fin = new Date(clase.inicio.getTime() + clase.duracionMin * 60_000);
  return {
    id: reserva.id,
    clase: clase.nombre,
    fecha: formatearFecha(clase.inicio),
    horario: `${formatearHora(clase.inicio)} a ${formatearHora(fin)}`,
    sala: clase.sala,
    estado: reserva.estado,
    presente: reserva.presente,
  };
}

export const FILTROS_RESERVA = ["TODAS", "CONFIRMADA", "CANCELADA"] as const satisfies readonly (
  | "TODAS"
  | EstadoReserva
)[];
export type FiltroReserva = (typeof FILTROS_RESERVA)[number];

export function filtrarReservas(filas: readonly FilaReserva[], filtro: FiltroReserva): FilaReserva[] {
  return filtro === "TODAS" ? [...filas] : filas.filter((fila) => fila.estado === filtro);
}
