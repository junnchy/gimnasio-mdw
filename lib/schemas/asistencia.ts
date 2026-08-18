import { z } from "zod";
import { id } from "./_common";

export const asistenciaSchema = z.object({
  reservaId: id,
  fecha: z.coerce.date(),
  presente: z.boolean(),
});
export type Asistencia = z.infer<typeof asistenciaSchema>;
