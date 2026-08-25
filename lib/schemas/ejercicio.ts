import { z } from "zod";

export const ejercicioSchema = z.object({
  nombre: z.string().min(2).max(80),
  grupoMuscular: z.string().min(2).max(50),
  descripcion: z.string().max(500).optional(),
  imagenUrl: z.string().url().max(2048).optional(),
});
export type Ejercicio = z.infer<typeof ejercicioSchema>;
