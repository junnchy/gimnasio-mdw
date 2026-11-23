import { crearMembresia } from "@/lib/db/membresias";
import { obtenerPlan } from "@/lib/db/planes";
import type { Resultado } from "@/lib/casos/resultado";

const DIA = 86_400_000;

/**
 * Asignar un plan a un socio (ADMIN, /socios/:id): la membresía cubre desde
 * `fechaInicio` la duración del plan. Es el mismo alta que `POST
 * /api/membresias` (`crearMembresia`), con la `fechaFin` calculada acá en vez
 * de pedírsela a recepción.
 */
export async function asignarMembresia(
  datos: { socioId: string; planId: string; fechaInicio: Date },
): Promise<Resultado<{ id: string; fechaFin: Date }>> {
  const plan = await obtenerPlan(datos.planId);
  if (!plan) return { ok: false, tipo: "NO_ENCONTRADO", mensaje: "Ese plan ya no existe. Elegí otro de la lista." };

  const fechaFin = new Date(datos.fechaInicio.getTime() + plan.duracionDias * DIA);
  const membresia = await crearMembresia({ ...datos, fechaFin });
  if (!membresia) return { ok: false, tipo: "NO_ENCONTRADO", mensaje: "No encontramos a ese socio. Volvé a la lista de socios." };
  return { ok: true, dato: { id: membresia.id, fechaFin: membresia.fechaFin } };
}
