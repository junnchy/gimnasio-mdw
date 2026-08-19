import { z } from "zod";
import { id, estadoVisita } from "./_common";

// Contrato de la entidad Visita (creación/validación).
// Convención del set: los schemas NO llevan `id` (lo maneja Prisma);
// para el input externo del QR, ver escaneo.ts (registrarEscaneoSchema).
export const visitaSchema = z.object({
  socioId: id,
  ingresoAt: z.coerce.date(),
  egresoAt: z.coerce.date().nullable(),
  estado: estadoVisita,
  // Solo se completa cuando la visita pasa a CERRADA.
  duracionMin: z.number().int().nonnegative().nullable(),
});
export type Visita = z.infer<typeof visitaSchema>;
