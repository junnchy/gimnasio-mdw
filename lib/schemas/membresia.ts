import { z } from "zod";
import { inicioDelDiaEnArgentina } from "@/lib/utils";
import { id, estadoMembresia } from "./_common";

const datosMembresiaSchema = z.object({
  socioId: id,
  planId: id,
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
});

export const membresiaSchema = datosMembresiaSchema
  .extend({ estado: estadoMembresia.default("ACTIVA") })
  .refine((d) => d.fechaFin > d.fechaInicio, {
    message: "fechaFin debe ser posterior a fechaInicio",
    path: ["fechaFin"],
  });

export const crearMembresiaSchema = datosMembresiaSchema
  .refine((d) => d.fechaFin > d.fechaInicio, {
    message: "fechaFin debe ser posterior a fechaInicio",
    path: ["fechaFin"],
  });
export type Membresia = z.infer<typeof membresiaSchema>;

/**
 * El formulario de /socios/:id para asignar un plan (ADMIN). La `fechaFin` no
 * se pide: la calcula el servidor con la duración del plan, así recepción no
 * puede cargar un período distinto del que se cobra.
 */
export const asignarMembresiaFormSchema = z.object({
  socioId: id.max(128),
  planId: id.max(128),
  fechaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí el día en que empieza")
    .transform(inicioDelDiaEnArgentina)
    .refine((fecha) => !Number.isNaN(fecha.getTime()), "Elegí una fecha válida"),
});
