/**
 * El cinturón de seguridad de las pruebas e2e. Escriben en la base: migran,
 * cargan el seed, borran las visitas de la socia de prueba, escanean,
 * reservan. Nunca pueden correr contra una base que importe.
 *
 * Se controlan LAS DOS variables de Prisma, no solo la de la app:
 *   DATABASE_URL  la usan la app y las pruebas para leer y escribir
 *   DIRECT_URL    la usa `prisma migrate deploy` (e2e/preparar.ts)
 * dotenv no pisa lo que ya está exportado: con `DATABASE_URL` local pero un
 * `DIRECT_URL` de producción exportado en la terminal, controlar una sola
 * dejaría correr las migraciones contra producción.
 *
 * Y "local" no alcanza: en localhost puede haber una base de desarrollo, o
 * una remota expuesta con un túnel (`ssh -L`). Por eso la base tiene que
 * llamarse exactamente `pulso_e2e`, un nombre que solo existe para esto, y
 * las dos URLs tienen que apuntar a esa misma base (mismo puerto y nombre;
 * localhost, 127.0.0.1 y ::1 son la misma máquina).
 *
 * Lo llaman `playwright.config.ts` (antes de compilar), `preparar.ts` (antes
 * de migrar y cargar el seed) y `estado.ts` (antes de borrar). Lo prueba
 * `base-local.test.ts`, con vitest.
 */
export const BASE_DESCARTABLE = "pulso_e2e";

const HOSTS_LOCALES = ["localhost", "127.0.0.1", "[::1]", "::1"];

type Entorno = Record<string, string | undefined>;

/** Puerto y nombre de la base, si la URL es local y descartable; si no, lanza. */
function destino(env: Entorno, variable: "DATABASE_URL" | "DIRECT_URL"): string {
  const valor = env[variable];
  if (!valor) throw new Error(`Las pruebas e2e necesitan ${variable}: revisá .env.e2e.`);

  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    throw new Error(`${variable} no es una URL válida.`);
  }

  if (!HOSTS_LOCALES.includes(url.hostname)) {
    throw new Error(`Las pruebas e2e solo corren contra una base local, y ${variable} apunta a ${url.hostname}.`);
  }
  const base = url.pathname.replace(/^\//, "");
  if (base !== BASE_DESCARTABLE) {
    throw new Error(
      `Las pruebas e2e solo corren contra la base descartable "${BASE_DESCARTABLE}", y ${variable} apunta a "${base}".`,
    );
  }
  return `puerto ${url.port || "5432"}, base ${base}`;
}

/** Lanza si DATABASE_URL y DIRECT_URL no son, las dos, la misma base local `pulso_e2e`. */
export function exigirBaseLocal(env: Entorno = process.env): void {
  const app = destino(env, "DATABASE_URL");
  const migraciones = destino(env, "DIRECT_URL");
  if (app !== migraciones) {
    throw new Error(`DATABASE_URL (${app}) y DIRECT_URL (${migraciones}) tienen que ser la misma base de pruebas.`);
  }
}
