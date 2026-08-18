import { z } from "zod";
import { id, estadoReserva } from "./_common";

export const reservaSchema = z.object({
  socioId: id,
  claseId: id,
  fecha: z.coerce.date(),
  estado: estadoReserva.default("CONFIRMADA"),
});
export type Reserva = z.infer<typeof reservaSchema>;
