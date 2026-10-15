/**
 * Lo que el inicio de profesor y admin necesita de cada clase (clase 10).
 *
 * Igual que `filaReserva.ts`: la fila cruza la frontera "use client"
 * (components/filtro-clases.tsx), así que es un objeto plano, con las fechas
 * ya formateadas en la hora del gimnasio y sin ids que la pantalla no use.
 * `esMia` se calcula en el servidor con el id de la sesión: al navegador no
 * le llega el id del profesor.
 *
 * Este archivo lo importa un componente de cliente: no puede importar Prisma,
 * Auth.js ni nada de `lib/db/`.
 */
import { formatearFecha, formatearHora } from "@/lib/utils";

export type FilaClase = {
  id: string;
  nombre: string;
  fecha: string;
  horario: string;
  sala: string | null;
  profesor: string;
  ocupados: number;
  cupo: number;
  sinCupo: boolean;
  esMia: boolean;
};

/** La forma mínima que devuelve `listarProximasClases`. */
type ClaseConCupo = {
  id: string;
  nombre: string;
  inicio: Date;
  duracionMin: number;
  sala: string | null;
  cupoMaximo: number;
  profesor: { id: string; nombre: string };
  _count: { reservas: number };
};

export function aFilaClase(clase: ClaseConCupo, usuarioId: string): FilaClase {
  const fin = new Date(clase.inicio.getTime() + clase.duracionMin * 60_000);
  const ocupados = clase._count.reservas;
  return {
    id: clase.id,
    nombre: clase.nombre,
    fecha: formatearFecha(clase.inicio),
    horario: `${formatearHora(clase.inicio)} a ${formatearHora(fin)}`,
    sala: clase.sala,
    profesor: clase.profesor.nombre,
    ocupados,
    cupo: clase.cupoMaximo,
    sinCupo: ocupados >= clase.cupoMaximo,
    esMia: clase.profesor.id === usuarioId,
  };
}

export const FILTROS_CLASE = ["TODAS", "CON_LUGAR", "MIAS"] as const;
export type FiltroClase = (typeof FILTROS_CLASE)[number];

export function filtrarClases(filas: readonly FilaClase[], filtro: FiltroClase): FilaClase[] {
  switch (filtro) {
    case "TODAS":
      return [...filas];
    case "CON_LUGAR":
      return filas.filter((fila) => !fila.sinCupo);
    case "MIAS":
      return filas.filter((fila) => fila.esMia);
  }
}
