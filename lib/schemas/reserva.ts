import { z } from "zod";
import { id, estadoReserva } from "./_common";

// La asistencia a clase se modela como `presente` en la reserva
// (se fusionó la entidad Asistencia acá).
// No hay `fecha` en la reserva: el horario de la reserva es el `inicio` de su
// Clase. Guardarlo acá duplicaría el dato y se desincronizaría si la clase se
// reprograma; cuándo se reservó ya lo dice `createdAt`.
export const reservaSchema = z.object({
  socioId: id,
  claseId: id,
  estado: estadoReserva.default("CONFIRMADA"),
  presente: z.boolean().default(false),
});
export type Reserva = z.infer<typeof reservaSchema>;
