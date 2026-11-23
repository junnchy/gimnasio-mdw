import { z } from "zod";

export const estadoFormularioSchema = z.object({
  estado: z.enum(["INICIAL", "ERROR", "EXITO"]),
  mensaje: z.string().max(2000).optional(),
  errores: z.record(z.array(z.string().max(1000)).optional()).optional(),
  // Lo que la persona escribió, para no perderlo si el envío falla (clase 12).
  valores: z.record(z.string().max(500)).optional(),
  // El link de cobro de Mercado Pago, cuando el admin registra un pago MP.
  enlace: z.string().url().max(2000).optional(),
  resultado: z.object({
    hora: z.string().max(40),
    duracionMin: z.number().nonnegative().nullable(),
  }).optional(),
});
export type EstadoFormulario = z.infer<typeof estadoFormularioSchema>;
export const SIN_ENVIAR: EstadoFormulario = { estado: "INICIAL" };
