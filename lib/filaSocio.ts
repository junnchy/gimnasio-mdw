/**
 * Lo que la pantalla de socios (/socios, ADMIN) muestra de cada socio.
 *
 * Cruza la frontera "use client" (components/filtro-socios.tsx): objeto
 * plano, fechas ya formateadas. El estado de la membresía se calcula acá con
 * `estadoMembresiaVista`, la única función que decide VENCIDA (ADR 0002).
 *
 * Este archivo lo importa un componente de cliente: no puede importar Prisma,
 * Auth.js ni nada de `lib/db/`.
 */
import { estadoMembresiaVista, type EstadoMembresiaVista } from "@/lib/membresia";
import type { EstadoMembresia } from "@/lib/schemas/_common";
import { formatearFecha } from "@/lib/utils";

export type FilaSocio = {
  id: string;
  nombre: string;
  email: string;
  plan: string | null;
  estado: EstadoMembresiaVista | null;
  /** "Vence el …", "Venció el …" o "Cancelada", según el estado. */
  vencimiento: string | null;
  ultimaVisita: string | null;
};

type SocioConMembresia = {
  id: string;
  nombre: string;
  email: string;
  membresias: { estado: EstadoMembresia; fechaFin: Date; plan: { nombre: string } }[];
  visitas: { ingresoAt: Date }[];
};

export function aFilaSocio(socio: SocioConMembresia, ahora: Date): FilaSocio {
  const membresia = socio.membresias[0];
  const estado = membresia ? estadoMembresiaVista(membresia, ahora) : null;
  const visita = socio.visitas[0];
  return {
    id: socio.id,
    nombre: socio.nombre,
    email: socio.email,
    plan: membresia?.plan.nombre ?? null,
    estado,
    vencimiento: !membresia
      ? null
      : estado === "CANCELADA"
        ? "Cancelada"
        : `${estado === "ACTIVA" ? "Vence" : "Venció"} el ${formatearFecha(membresia.fechaFin)}`,
    ultimaVisita: visita ? formatearFecha(visita.ingresoAt) : null,
  };
}

/**
 * "Sin membresía" junta a quien nunca tuvo una y a quien la tiene CANCELADA:
 * para recepción, los dos tienen que pasar a elegir un plan.
 */
export const FILTROS_SOCIO = ["TODOS", "ACTIVAS", "VENCIDAS", "SIN_MEMBRESIA"] as const;
export type FiltroSocio = (typeof FILTROS_SOCIO)[number];

export function filtrarSocios(filas: readonly FilaSocio[], filtro: FiltroSocio): FilaSocio[] {
  switch (filtro) {
    case "TODOS":
      return [...filas];
    case "ACTIVAS":
      return filas.filter((fila) => fila.estado === "ACTIVA");
    case "VENCIDAS":
      return filas.filter((fila) => fila.estado === "VENCIDA");
    case "SIN_MEMBRESIA":
      return filas.filter((fila) => fila.estado === null || fila.estado === "CANCELADA");
  }
}
