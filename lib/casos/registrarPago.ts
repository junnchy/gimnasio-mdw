import { randomUUID } from "node:crypto";
import { obtenerMembresiaParaPago } from "@/lib/db/membresias";
import { registrarPago as guardarPago } from "@/lib/db/pagos";
import { puedeRegistrarPago, type CodigoRechazoPago, type MedioPago } from "@/lib/pago";
import type { Veredicto } from "@/lib/reglas";
import { crearPreferenciaDePago } from "@/lib/servicios/mercadoPago";

export const MENSAJE_MP_NO_DISPONIBLE =
  "Mercado Pago no está disponible en este momento. No es un problema de los datos cargados: " +
  "probá de nuevo en unos minutos o registrá el pago en efectivo.";

type Registrado = Awaited<ReturnType<typeof guardarPago>> & { checkoutUrl: string | null };

export type ResultadoPago =
  | { ok: true; dato: Registrado }
  | { ok: false; tipo: "NO_ENCONTRADO" }
  | { ok: false; tipo: "CONFLICTO"; veredicto: Veredicto<CodigoRechazoPago> }
  | { ok: false; tipo: "MERCADO_PAGO_NO_DISPONIBLE" };

/**
 * H7 — registrar el pago de una cuota (ADMIN). Lo comparten `POST /api/pagos`
 * y la pantalla /socios/:id, así las dos siguen la spec §8 de la misma forma:
 *
 * - EFECTIVO: el camino manual. No pasa por Mercado Pago; nace APROBADO y
 *   renueva la membresía en la misma transacción.
 * - MP: Mercado Pago es ESENCIAL. Sin link de cobro no hay pago MP que
 *   registrar, así que la preferencia se pide ANTES de tocar la base. El id
 *   del pago se genera acá porque viaja como `external_reference`: es lo que
 *   el webhook usa después para encontrarlo.
 */
export async function registrarPago(
  datos: { membresiaId: string; monto: number; fecha: Date; medio: MedioPago },
  ahora: Date,
): Promise<ResultadoPago> {
  const membresia = await obtenerMembresiaParaPago(datos.membresiaId);
  if (!membresia) return { ok: false, tipo: "NO_ENCONTRADO" };

  const veredicto = puedeRegistrarPago({ estadoMembresia: membresia.estado });
  if (!veredicto.ok) return { ok: false, tipo: "CONFLICTO", veredicto };

  if (datos.medio === "EFECTIVO") {
    return { ok: true, dato: { ...(await guardarPago(datos, membresia, ahora)), checkoutUrl: null } };
  }

  const id = randomUUID();
  const preferencia = await crearPreferenciaDePago({ id, monto: datos.monto });
  if (!preferencia) return { ok: false, tipo: "MERCADO_PAGO_NO_DISPONIBLE" };

  return { ok: true, dato: { ...(await guardarPago({ ...datos, id }, membresia, ahora)), checkoutUrl: preferencia.init_point } };
}
