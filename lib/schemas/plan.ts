import { z } from "zod";

export const planSchema = z.object({
  nombre: z.string().min(2).max(80),
  descripcion: z.string().max(500).optional(),
  // Plata: se valida con múltiplos de centavo para que el contrato coincida
  // con el `Decimal(10,2)` de Prisma (regla de la clase 3: mismo resultado).
  precio: z.number().nonnegative().multipleOf(0.01),
  duracionDias: z.number().int().positive().max(3650),
  activo: z.boolean().default(true),
});
export type Plan = z.infer<typeof planSchema>;
