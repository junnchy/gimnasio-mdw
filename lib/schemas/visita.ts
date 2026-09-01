import { z } from "zod";
import { id, estadoVisita } from "./_common";

// Contrato de la entidad Visita (creación/validación).
// Convención del set: los schemas NO llevan `id` (lo maneja Prisma);
// para el input externo del QR, ver escaneo.ts (registrarEscaneoSchema).
// `duracionMin` no está acá: se calcula con `calcularDuracionMin()` en
// lib/visita.ts (ADR 0003) y nunca se guarda en la base.
export const visitaSchema = z.object({
  socioId: id,
  ingresoAt: z.coerce.date(),
  egresoAt: z.coerce.date().nullable(),
  estado: estadoVisita,
});
export type Visita = z.infer<typeof visitaSchema>;
