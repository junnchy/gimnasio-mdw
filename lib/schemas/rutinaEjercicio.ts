import { z } from "zod";
import { id } from "./_common";

export const rutinaEjercicioSchema = z.object({
  rutinaId: id,
  ejercicioId: id,
  series: z.number().int().positive().max(20),
  repeticiones: z.number().int().positive().max(100),
  descansoSeg: z.number().int().nonnegative().max(600),
  orden: z.number().int().nonnegative(),
});
export type RutinaEjercicio = z.infer<typeof rutinaEjercicioSchema>;
