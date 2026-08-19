import { z } from "zod";
import { id, estadoReserva } from "./_common";

// La asistencia a clase se modela como `presente` en la reserva
// (se fusionó la entidad Asistencia acá).
export const reservaSchema = z.object({
  socioId: id,
  claseId: id,
  fecha: z.coerce.date(),
  estado: estadoReserva.default("CONFIRMADA"),
  presente: z.boolean().default(false),
});
export type Reserva = z.infer<typeof reservaSchema>;
