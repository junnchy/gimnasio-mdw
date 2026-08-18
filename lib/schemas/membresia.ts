import { z } from "zod";
import { id, estadoMembresia } from "./_common";

export const membresiaSchema = z
  .object({
    socioId: id,
    planId: id,
    fechaInicio: z.coerce.date(),
    fechaFin: z.coerce.date(),
    estado: estadoMembresia.default("ACTIVA"),
  })
  .refine((d) => d.fechaFin > d.fechaInicio, {
    message: "fechaFin debe ser posterior a fechaInicio",
    path: ["fechaFin"],
  });
export type Membresia = z.infer<typeof membresiaSchema>;
