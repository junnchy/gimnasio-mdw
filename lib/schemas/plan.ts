import { z } from "zod";

export const planSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  descripcion: z.string().trim().max(500).optional(),
  precio: z.number().nonnegative(),
  duracionDias: z.number().int().positive().max(3650),
  activo: z.boolean().default(true),
});
export type Plan = z.infer<typeof planSchema>;

export const listarPlanesSchema = z.object({
  limite: z.coerce.number().int().min(1).max(100).default(50),
});
