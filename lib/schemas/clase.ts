import { z } from "zod";
import { id } from "./_common";

export const claseSchema = z.object({
  nombre: z.string().min(2).max(80),
  profesorId: id,
  cupoMaximo: z.number().int().positive().max(500),
  inicio: z.coerce.date(),
  duracionMin: z.number().int().positive().max(480),
  sala: z.string().max(50).optional(),
});
export type Clase = z.infer<typeof claseSchema>;
