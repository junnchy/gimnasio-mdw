/**
 * El cinturón de seguridad de las pruebas e2e: reservan clases y crean socios,
 * así que corridas contra la base de producción dejarían datos falsos en
 * pantallas reales.
 *
 * Se controlan LAS DOS variables de Prisma, no solo la de la app:
 *   DATABASE_URL  la usa la app y las pruebas para leer y escribir
 *   DIRECT_URL    la usa `prisma migrate deploy` (e2e/preparar.ts)
 * dotenv no pisa lo que ya está exportado: con `DATABASE_URL` local pero un
 * `DIRECT_URL` de producción exportado en la terminal, controlar una sola
 * dejaría correr las migraciones contra producción.
 */
const HOSTS_LOCALES = ["localhost", "127.0.0.1", "[::1]", "::1"];

function hostDe(variable: string, valor: string | undefined): string {
  if (!valor) throw new Error(`Las pruebas e2e necesitan ${variable}: revisá .env.e2e.`);
  try {
    return new URL(valor).hostname;
  } catch {
    throw new Error(`${variable} no es una URL válida.`);
  }
}

/** Lanza si alguna de las dos URLs de Prisma no apunta a una base local. */
export function exigirBasesLocales(env: Record<string, string | undefined>): void {
  for (const variable of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const host = hostDe(variable, env[variable]);
    if (!HOSTS_LOCALES.includes(host)) {
      throw new Error(`Las pruebas e2e solo corren contra una base local, y ${variable} apunta a ${host}.`);
    }
  }
}
