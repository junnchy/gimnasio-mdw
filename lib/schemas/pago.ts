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
