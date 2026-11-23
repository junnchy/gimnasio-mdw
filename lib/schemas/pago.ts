import { z } from "zod";
import { id, medioPago, estadoPago } from "./_common";

export const pagoSchema = z.object({
  membresiaId: id,
  // Plata: ver `planSchema.precio` — mismo criterio que el `Decimal(10,2)`.
  monto: z.number().positive().multipleOf(0.01),
  fecha: z.coerce.date(),
  medio: medioPago,
  estado: estadoPago.default("PENDIENTE"),
  refExterna: z.string().max(120).optional(),
});
export type Pago = z.infer<typeof pagoSchema>;

/**
 * El formulario de /socios/:id para cobrar una cuota (ADMIN). Mismas reglas
 * que `pagoSchema`; ni el estado ni la fecha vienen del formulario: el estado
 * lo decide el servidor según el medio (spec §8) y la fecha es la del cobro.
 */
export const registrarPagoFormSchema = pagoSchema.pick({ membresiaId: true, medio: true }).extend({
  membresiaId: id.max(128),
  monto: z.coerce.number({ invalid_type_error: "Ingresá el monto en números" }).pipe(pagoSchema.shape.monto),
});
