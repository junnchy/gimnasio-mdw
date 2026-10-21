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
 * También se acepta una URL ABSOLUTA si es de nuestro propio origen: es lo
 * que manda Auth.js cuando el que redirige es él (por ejemplo, desde
 * /api/auth/signin). Se compara contra el origen del propio request y a
 * `redirect()` solo le llega la ruta (sin el dominio), así que aunque alguien
 * falseara el header Host, la redirección no puede salir del sitio.
 *
 * `error` es el código que manda Auth.js cuando rechaza un ingreso. Es una
 * unión literal, como todo estado: un código desconocido o armado a mano se
 * trata como "Default" (mensaje genérico).
 *
 * Nada de esto corta el flujo: un parámetro raro se ignora y se vuelve al
 * inicio. Por eso cada campo termina en `.catch(...)`.
 */
const ORIGEN_DE_PRUEBA = "http://pulso.invalid";

/**
 * La ruta interna normalizada (pathname + query + hash), o undefined si el
 * valor lleva a otro sitio. Normalizada quiere decir sin tabs y con "/" en
 * vez de "\": a redirect() nunca le llega el texto tal como vino en la URL.
 */
export function aRutaInterna(valor: string, origenPropio?: string): string | undefined {
  let url: URL;
  try {
    if (valor.startsWith("/")) {
      url = new URL(valor, ORIGEN_DE_PRUEBA);
      if (url.origin !== ORIGEN_DE_PRUEBA) return undefined;
    } else {
      if (!origenPropio) return undefined;
      url = new URL(valor);
      if (url.origin !== origenPropio) return undefined;
    }
  } catch {
    return undefined;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export const codigoErrorIngreso = z.enum(["AccessDenied", "Configuration", "Verification", "Default"]);
export type CodigoErrorIngreso = z.infer<typeof codigoErrorIngreso>;

/** El schema de /ingresar. `origenPropio` es el origen del request (ej. "https://gimnasio-mdw.vercel.app"). */
export function crearParametrosIngreso(origenPropio?: string) {
  return z.object({
    callbackUrl: z
      .string()
      .max(300)
      .transform((valor, ctx) => {
        const ruta = aRutaInterna(valor, origenPropio);
        if (ruta === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ruta externa" });
          return z.NEVER;
        }
        return ruta;
      })
      .optional()
      .catch(undefined),
    error: codigoErrorIngreso.optional().catch("Default"),
  });
}

/** Sin origen conocido: solo se aceptan rutas relativas. */
export const parametrosIngreso = crearParametrosIngreso();

export type ParametrosIngreso = z.infer<typeof parametrosIngreso>;
