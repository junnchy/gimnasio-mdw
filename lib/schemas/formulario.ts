import { z } from "zod";

export const estadoFormularioSchema = z.object({
  estado: z.enum(["INICIAL", "ERROR", "EXITO"]),
  mensaje: z.string().max(2000).optional(),
  errores: z.record(z.array(z.string().max(1000)).optional()).optional(),
  valores: z.object({ claseId: z.string().max(128).optional() }).optional(),
  resultado: z.object({
    hora: z.string().max(40),
    duracionMin: z.number().nonnegative().nullable(),
  }).optional(),
});
export type EstadoFormulario = z.infer<typeof estadoFormularioSchema>;
export const SIN_ENVIAR: EstadoFormulario = { estado: "INICIAL" };
