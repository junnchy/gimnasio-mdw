/**
 * Autenticación y autorización (clase 6).
 *
 *   ¿Quién sos?      → autenticación. La resuelve Auth.js con Google. Se
 *                      configura una vez y no se toca más.
 *   ¿Esto lo podés?  → autorización. La resuelve nuestro dominio: el rol
 *                      sale de la tabla `User`, no del proveedor.
 *
 * Google prueba que alguien es dueño de un mail. No sabe —ni puede saber— si
 * esa persona es profesora del gimnasio. Por eso el `upsert` de abajo crea
 * SIEMPRE el rol de menor privilegio (SOCIO), y un ADMIN o PROFESOR solo
 * existe si alguien lo cargó en la base (seed o Prisma Studio).
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";

/**
 * Lo que el resto del proyecto conoce de quien hace el request.
 *
 * `rol` sale de `@prisma/client`, no de una unión escrita a mano: si acá
 * dijera "PROFE" y la base "PROFESOR", la comparación daría `false` siempre y
 * el sistema respondería 403 a todos sin que nada falle a la vista.
 */
export type UsuarioSesion = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
};

/**
 * Los dos errores de autorización, con nombre propio. `responderError` los
 * distingue con `instanceof` para responder 401 o 403 en lugar de 500, sin
 * comparar strings. Se definen en `lib/errores.ts` (sin dependencias) y se
 * re-exportan acá.
 */
import { NoAutenticado, NoAutorizado } from "@/lib/errores";
export { NoAutenticado, NoAutorizado };

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      rol: Rol;
    };
  }
}

// Sin este import TypeScript no encuentra el módulo para la ampliación de abajo.
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    usuarioId?: string;
    rol?: Rol;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Lee AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET del entorno.
  providers: [Google],

  /**
   * La sesión viaja en una cookie cifrada (JWE), no en una tabla: cero
   * consultas a la base para saber quién llama.
   *
   * Lo que se resigna: EL ROL DEL TOKEN ES UNA FOTO. Si un admin pasa a
   * alguien de SOCIO a PROFESOR, sigue siendo socio hasta que cierre sesión y
   * vuelva a entrar. Ver docs/adr/0004-identidad-delegada-y-sesion-en-token.md.
   */
  session: { strategy: "jwt" },

  callbacks: {
    /** Corre una vez, al entrar: el único momento en que `user` trae los datos de Google. */
    async jwt({ token, user }) {
      if (user?.email) {
        const usuario = await prisma.user.upsert({
          where: { email: user.email },
          // Vacío a propósito: si la persona ya existe, Google NO pisa lo que
          // dice nuestra base. Con `{ rol: "SOCIO" }` acá, un profesor
          // perdería su rol en el siguiente login.
          update: {},
          create: {
            email: user.email,
            nombre: user.name ?? user.email,
            rol: "SOCIO", // siempre el menor privilegio
          },
        });

        token.usuarioId = usuario.id;
        token.rol = usuario.rol;
      }

      return token;
    },

    /** Corre en cada request: pasa del token a lo que ve el código. */
    async session({ session, token }) {
      if (token.usuarioId && token.rol) {
        session.user.id = token.usuarioId;
        session.user.rol = token.rol;
      }

      return session;
    },
  },
});

/**
 * El usuario de la sesión, o null si no hay.
 * Para páginas que funcionan con y sin alguien logueado.
 */
export async function obtenerUsuario(): Promise<UsuarioSesion | null> {
  const sesion = await auth();

  if (!sesion?.user?.id) return null;

  return {
    id: sesion.user.id,
    email: sesion.user.email,
    nombre: sesion.user.name ?? sesion.user.email,
    rol: sesion.user.rol,
  };
}

/**
 * El usuario de la sesión, o se corta el request.
 *
 * Esta LANZA —a diferencia de las reglas de la clase 5, que devuelven— porque
 * es la primera línea de todos los endpoints: si devolviera un valor, el día
 * que alguien olvide el `if` el endpoint queda abierto sin que nada avise.
 * Lanzando, olvidarse rompe el request en vez de dejarlo pasar.
 * La traduce `responderError`, en el borde.
 */
export async function requerirUsuario(rol?: Rol): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuario();

  if (!usuario) throw new NoAutenticado();

  // Se compara acá y no en la interfaz: esconder un botón no impide que
  // alguien llame al endpoint con Postman.
  if (rol && usuario.rol !== rol) throw new NoAutorizado();

  return usuario;
}
