import { z } from "zod";
import { id } from "./_common";

export const rutinaSchema = z.object({
  nombre: z.string().min(2).max(80),
  objetivo: z.string().max(200).optional(),
  profesorId: id,
  socioId: id,
});
export type Rutina = z.infer<typeof rutinaSchema>;
