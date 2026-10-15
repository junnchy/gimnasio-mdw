import { z } from "zod";

/**
 * Los parámetros de /ingresar (clase 10). Llegan en la URL, así que son
 * entrada externa: cualquiera puede armar un link con lo que quiera adentro.
 *
 * `callbackUrl` es a dónde volver después de entrar. Solo se acepta una ruta
 * INTERNA ("/reservas/1"): si se aceptara cualquier valor, un link a
 * `/ingresar?callbackUrl=https://sitio-falso.com` usaría nuestro login para
 * mandar a alguien a otro sitio justo después de confiar en él (open redirect).
 *
 * No alcanza con mirar cómo empieza el texto: "//sitio.com", "/\sitio.com" y
 * "/<tab>/sitio.com" empiezan con "/" y el navegador los lee como OTRO dominio
 * (descarta tabs y saltos de línea, y trata "\" como "/"). Por eso la ruta se
 * resuelve como lo haría el navegador y se exige que siga en nuestro origen.
 *
 * `error` es el código que manda Auth.js cuando rechaza un ingreso. Es una
 * unión literal, como todo estado: un código desconocido o armado a mano se
 * trata como "Default" (mensaje genérico).
 *
 * Nada de esto corta el flujo: un parámetro raro se ignora y se vuelve al
 * inicio. Por eso cada campo termina en `.catch(...)`.
 */
const ORIGEN_DE_PRUEBA = "http://pulso.invalid";

function esRutaInterna(ruta: string): boolean {
  if (!ruta.startsWith("/")) return false;
  try {
    return new URL(ruta, ORIGEN_DE_PRUEBA).origin === ORIGEN_DE_PRUEBA;
  } catch {
    return false;
  }
}

// Además de validar, se devuelve la ruta YA normalizada (sin tabs, con "/" en
// vez de "\"): a redirect() nunca le llega el texto tal como vino en la URL.
const rutaInterna = z
  .string()
  .max(200)
  .refine(esRutaInterna, { message: "ruta externa" })
  .transform((ruta) => {
    const url = new URL(ruta, ORIGEN_DE_PRUEBA);
    return `${url.pathname}${url.search}${url.hash}`;
  });

export const codigoErrorIngreso = z.enum(["AccessDenied", "Configuration", "Verification", "Default"]);
export type CodigoErrorIngreso = z.infer<typeof codigoErrorIngreso>;

export const parametrosIngreso = z.object({
  callbackUrl: rutaInterna.optional().catch(undefined),
  error: codigoErrorIngreso.optional().catch("Default"),
});

export type ParametrosIngreso = z.infer<typeof parametrosIngreso>;
