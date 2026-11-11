/**
 * LAS PRUEBAS NO PASAN POR GOOGLE.
 *
 * El login de Google pide una persona, y lo que se quiere probar es nuestro
 * sistema, no a Google. Lo único que deja Google, al final, es una cookie que
 * Auth.js cifra con `AUTH_SECRET` (clase 6). Esto arma LA MISMA cookie, con la
 * misma función (`encode` de Auth.js) y con el contenido que arma el callback
 * `jwt` de `lib/auth.ts`: el id de nuestra base y el rol.
 *
 * Lo que NO hay: ningún "modo prueba" en `lib/auth.ts`, ningún usuario mágico,
 * ningún `if (process.env.E2E)`. La app que se prueba es la que corre en
 * Vercel; lo único distinto es el secreto, que en producción nadie conoce.
 */
import { encode } from "next-auth/jwt";
import type { Rol } from "@prisma/client";

/** En http se llama así; en https Auth.js le agrega `__Secure-`. */
export const COOKIE_SESION = "authjs.session-token";

export type UsuarioDePrueba = { id: string; email: string; nombre: string; rol: Rol };

/** El valor cifrado de la cookie de sesión de `usuario`. */
export async function valorDeSesion(usuario: UsuarioDePrueba): Promise<string> {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) throw new Error("Falta AUTH_SECRET: revisá .env.e2e.");
  return encode({
    token: { sub: usuario.id, email: usuario.email, name: usuario.nombre, usuarioId: usuario.id, rol: usuario.rol },
    secret: secreto,
    salt: COOKIE_SESION,
  });
}

/** El header `Cookie` para pegarle a la API como `usuario`, sin navegador. */
export async function headerDeSesion(usuario: UsuarioDePrueba): Promise<{ Cookie: string }> {
  return { Cookie: `${COOKIE_SESION}=${await valorDeSesion(usuario)}` };
}
