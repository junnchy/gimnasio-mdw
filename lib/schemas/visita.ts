import { z } from "zod";
import { id, estadoVisita } from "./_common";

// Entrada de un escaneo de QR (sirve tanto para ingreso como para egreso;
// el servidor decide cuál según si el socio tiene una visita ABIERTA).
export const registrarEscaneoSchema = z.object({
  socioId: id,
  qrToken: z.string().min(10, "token de QR inválido").max(512),
  // Geolocalización opcional para anti-fraude (QR fijo en la puerta).
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
export type RegistrarEscaneo = z.infer<typeof registrarEscaneoSchema>;

// Representación de una Visita al gimnasio.
export const visitaSchema = z.object({
  id: id,
  socioId: id,
  ingresoAt: z.coerce.date(),
  egresoAt: z.coerce.date().nullable(),
  estado: estadoVisita,
  // Solo se completa cuando la visita pasa a CERRADA.
  duracionMin: z.number().int().nonnegative().nullable(),
});
export type Visita = z.infer<typeof visitaSchema>;
