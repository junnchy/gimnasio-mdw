import { esDuplicado } from "@/lib/db/errores";
import { crearMembresia } from "@/lib/db/membresias";
import { obtenerPlan } from "@/lib/db/planes";
import { rechazo, type Resultado } from "@/lib/casos/resultado";
import { calcularFechaFin } from "@/lib/membresia";

export const MENSAJE_MEMBRESIA_ACTIVA =
  "Este socio ya tiene una membresía activa. Recargá la página: para extenderla, registrá un pago.";

/**
 * Asignar un plan a un socio (ADMIN). Lo comparten `POST /api/membresias` y la
 * pantalla /socios/:id:
 *
 * - La pantalla manda solo el día de inicio: la `fechaFin` sale de la
 *   duración del plan (`calcularFechaFin`).
 * - La API recibe la `fechaFin` explícita, como dice su contrato.
 *
 * Un socio tiene UNA membresía ACTIVA: no lo decide un `if` acá sino el
 * índice `Membresia_socio_activa_key`. Si dos altas llegan juntas, la base
 * acepta una y a la otra le devuelve un duplicado (P2002), que se vuelve un
 * rechazo de negocio, nunca un 500.
 */
export async function asignarMembresia(
  datos: { socioId: string; planId: string; fechaInicio: Date; fechaFin?: Date },
): Promise<Resultado<NonNullable<Awaited<ReturnType<typeof crearMembresia>>>>> {
  let fechaFin = datos.fechaFin;
  if (!fechaFin) {
    const plan = await obtenerPlan(datos.planId);
    if (!plan) return { ok: false, tipo: "NO_ENCONTRADO", mensaje: "Ese plan ya no existe. Elegí otro de la lista." };
    fechaFin = calcularFechaFin(datos.fechaInicio, plan.duracionDias);
  }

  try {
    const membresia = await crearMembresia({ socioId: datos.socioId, planId: datos.planId, fechaInicio: datos.fechaInicio, fechaFin });
    if (!membresia) return { ok: false, tipo: "NO_ENCONTRADO", mensaje: "No encontramos a ese socio o a ese plan. Volvé a la lista de socios." };
    return { ok: true, dato: membresia };
  } catch (error) {
    if (esDuplicado(error)) return rechazo([{ codigo: "MEMBRESIA_ACTIVA_DUPLICADA", mensaje: MENSAJE_MEMBRESIA_ACTIVA }]);
    throw error;
  }
}
