/**
 * La traducción de una excepción a respuesta HTTP. UN SOLO LUGAR (clase 6).
 *
 * Hasta la clase 5 cada `catch` terminaba en un 500. Desde que
 * `requerirUsuario` lanza, eso ya no alcanza: si ese error cayera en el 500
 * genérico, alguien sin sesión vería "Error interno".
 *
 * Los dos errores viven acá y no en `lib/auth.ts` para que este módulo no
 * dependa de Auth.js ni de Prisma: así los tests de los handlers pueden
 * simular la sesión sin levantar ninguno de los dos. `lib/auth.ts` los
 * re-exporta, de modo que para el resto del proyecto salen de ahí.
 */
import { NextResponse } from "next/server";

/** No hay sesión → 401. "No sé quién sos." */
export class NoAutenticado extends Error {}

/** Hay sesión, pero el rol no alcanza → 403. "Sé quién sos y no podés." */
export class NoAutorizado extends Error {}

/**
 * `endpoint` entra por parámetro para que el log de Vercel diga qué ruta
 * falló, que es lo único que lo hace útil cuando algo se rompe de noche.
 */
export function responderError(endpoint: string, error: unknown) {
  if (error instanceof NoAutenticado) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (error instanceof NoAutorizado) {
    return NextResponse.json({ error: "No podés realizar esta operación" }, { status: 403 });
  }

  // Solo llega lo que NO se previó. El detalle va al log, que es nuestro; la
  // respuesta, que la lee cualquiera, no cuenta nada.
  console.error(endpoint, error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
