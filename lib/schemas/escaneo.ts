import { z } from "zod";
import { id } from "./_common";

// Contrato de INPUT del escaneo de QR (ingreso o egreso).
// El servidor decide si abre o cierra la visita según el estado del socio.
// Validar con safeParse() en el borde del sistema.
export const registrarEscaneoSchema = z.object({
  socioId: id,
  qrToken: z.string().min(10, "token de QR inválido").max(512),
  // Geolocalización opcional para anti-fraude (QR fijo en la puerta).
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
export type RegistrarEscaneo = z.infer<typeof registrarEscaneoSchema>;
