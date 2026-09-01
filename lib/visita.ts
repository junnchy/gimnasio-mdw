/**
 * Regla del ADR 0003: la duración de una visita no se guarda, se calcula.
 *
 * Es la diferencia entre los dos hechos (ingresoAt, egresoAt). Si mañana un
 * admin corrige el egreso a mano, una duración guardada quedaría mintiendo;
 * calculada, nunca. Es el mismo criterio que llevó a calcular VENCIDA en la
 * membresía (ADR 0002). Las visitas INCOMPLETA (sin egreso) no computan.
 */
export function calcularDuracionMin(ingresoAt: Date, egresoAt: Date): number {
  return Math.round((egresoAt.getTime() - ingresoAt.getTime()) / 60000);
}
