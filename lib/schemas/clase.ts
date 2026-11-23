import { z } from "zod";
import { fechaHoraArgentina } from "@/lib/utils";
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

/** Lo que manda `<input type="datetime-local">`: "2026-12-01T18:00", hora del gimnasio. */
const fechaHoraLocal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Elegí el día y la hora de la clase")
  .transform(fechaHoraArgentina)
  .refine((fecha) => !Number.isNaN(fecha.getTime()), "Elegí una fecha válida");

/**
 * El formulario de /clases/nueva (PROFESOR). Son las MISMAS reglas que
 * `claseSchema` —se derivan de él, no se copian—; lo único que cambia es que
 * un formulario manda texto: los números se convierten y la hora se lee en la
 * zona del gimnasio. El `profesorId` no está: sale de la sesión.
 */
export const programarClaseFormSchema = claseSchema.omit({ profesorId: true }).extend({
  nombre: z.string().trim().pipe(claseSchema.shape.nombre),
  cupoMaximo: z.coerce.number().pipe(claseSchema.shape.cupoMaximo),
  inicio: fechaHoraLocal,
  duracionMin: z.coerce.number().pipe(claseSchema.shape.duracionMin),
  // Vacía = sin sala asignada, igual que no mandarla a la API.
  sala: z.string().trim().max(50).transform((sala) => sala || undefined).optional(),
});
