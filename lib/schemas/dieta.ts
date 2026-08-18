import { z } from "zod";
import { id } from "./_common";

export const dietaSchema = z.object({
  nombre: z.string().min(2).max(80),
  objetivo: z.string().max(200).optional(),
  caloriasObjetivo: z.number().int().positive().max(10000).optional(),
  profesorId: id,
  socioId: id,
});
export type Dieta = z.infer<typeof dietaSchema>;
