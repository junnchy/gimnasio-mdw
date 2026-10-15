import { z } from "zod";

/**
 * Los parámetros de /ingresar (clase 10). Llegan en la URL, así que son
 * entrada externa: cualquiera puede armar un link con lo que quiera adentro.
 *
 * `callbackUrl` es a dónde volver después de entrar. Solo se acepta una ruta
 * INTERNA ("/reservas/1"): si se aceptara cualquier valor, un link a
 * `/ingresar?callbackUrl=https://sitio-falso.com` usaría nuestro login para
 * mandar a alguien a otro sitio justo después de confiar en él (open redirect).
 * "//sitio.com" y "/\sitio.com" también se descartan: el navegador los lee
 * como direcciones de otro dominio.
 *
 * Nada de esto corta el flujo: un parámetro raro se ignora y se vuelve al
 * inicio. Por eso cada campo termina en `.catch(undefined)`.
 */
const rutaInterna = z
  .string()
  .max(200)
  .refine((ruta) => ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.startsWith("/\\"), {
    message: "ruta externa",
  });

export const parametrosIngreso = z.object({
  callbackUrl: rutaInterna.optional().catch(undefined),
  error: z.string().max(50).optional().catch(undefined),
});

export type ParametrosIngreso = z.infer<typeof parametrosIngreso>;
