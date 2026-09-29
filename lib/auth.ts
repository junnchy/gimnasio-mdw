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
 *
 * ⚠️ NO IMPORTAR ESTE ARCHIVO DESDE UN `middleware.ts`. El middleware de Next
 * corre en el runtime Edge, donde Prisma no funciona, y este archivo importa
 * Prisma (el upsert del callback `jwt`). Si algún día hace falta un
 * middleware, hay que separar la configuración de Auth.js en un archivo sin
 * Prisma (`auth.config.ts`) y que el middleware importe solo ese.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
// Sin este import TypeScript no encuentra el módulo `next-auth/jwt` para la
// ampliación de tipos de más abajo.
import "next-auth/jwt";
import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";
// Los dos errores de autorización se definen en `lib/errores.ts` (sin
// dependencias, para que los tests de los handlers no carguen Auth.js ni
// Prisma) y se re-exportan acá: para el resto del proyecto salen de este archivo.
import { NoAutenticado, NoAutorizado } from "@/lib/errores";

export { NoAutenticado, NoAutorizado };

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

declare module "next-auth/jwt" {
  interface JWT {
    usuarioId?: string;
    rol?: Rol;
  }
}

/**
 * ¿Podemos confiar en que quien entra es dueño de ese mail?
 *
 * El callback `jwt` vincula la cuenta con un usuario de nuestra base SOLO por
 * el mail, y copia su rol al token. Si aceptáramos un mail que Google no
 * verificó, alguien podría presentarse con el mail de un ADMIN y heredar su
 * rol. Por eso, antes de tocar la base, se exigen tres cosas:
 *
 * 1. Que el login venga de Google (el único proveedor configurado).
 * 2. Que Google diga que el mail está verificado (`email_verified === true`),
 *    leído del perfil original del proveedor, no de `user.email`.
 * 3. Que Google sea AUTORITATIVO para ese mail: una cuenta @gmail.com, o una
 *    de Google Workspace (el perfil trae `hd`, el dominio de la organización).
 *    Para una cuenta de Google creada con un mail de otro proveedor (Outlook,
 *    Yahoo), Google advierte que haber verificado ese mail alguna vez no
 *    prueba que la persona lo siga controlando hoy.
 *
 * Es una función pura y exportada para poder probarla sin Auth.js.
 */
export function esIdentidadGoogleConfiable(datos: {
  readonly proveedor: string | undefined;
  readonly perfil: { readonly email?: string | null; readonly email_verified?: boolean | null; readonly hd?: unknown } | undefined;
}): boolean {
  if (datos.proveedor !== "google" || !datos.perfil) return false;

  const email = datos.perfil.email?.trim().toLowerCase();
  if (!email) return false;
  if (datos.perfil.email_verified !== true) return false;

  const esGmail = email.endsWith("@gmail.com");
  const esWorkspace = typeof datos.perfil.hd === "string" && datos.perfil.hd.length > 0;
  return esGmail || esWorkspace;
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
    /**
     * Corre ANTES que `jwt`: si devuelve false, Auth.js corta el login y no se
     * llega ni al upsert ni a emitir una sesión. Ver `esIdentidadGoogleConfiable`.
     */
    async signIn({ account, profile }) {
      return esIdentidadGoogleConfiable({ proveedor: account?.provider, perfil: profile });
    },

    /** Corre una vez, al entrar: el único momento en que `user` trae los datos de Google. */
    async jwt({ token, user }) {
      // Google ya lo manda en minúsculas; se normaliza igual para que coincida
      // siempre con el del seed (que también se guarda en minúsculas).
      const email = user?.email?.trim().toLowerCase();
      if (user && email) {
        const usuario = await prisma.user.upsert({
          where: { email },
          // Vacío a propósito: si la persona ya existe, Google NO pisa lo que
          // dice nuestra base. Con `{ rol: "SOCIO" }` acá, un profesor
          // perdería su rol en el siguiente login.
          update: {},
          create: {
            email,
            nombre: user.name ?? email,
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
