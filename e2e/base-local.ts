/**
 * Las pruebas e2e escriben en la base: migran, cargan el seed, borran las
 * visitas de la socia de prueba, escanean, reservan. Nunca pueden correr
 * contra una base que importe.
 *
 * "Local" no alcanza: en localhost puede haber una base de desarrollo, o una
 * remota expuesta con un túnel (`ssh -L`). Por eso, además, la base tiene que
 * llamarse exactamente `pulso_e2e`: un nombre que solo existe para esto. Y
 * DATABASE_URL y DIRECT_URL tienen que apuntar a esa misma base, porque las
 * migraciones usan una y la app la otra.
 *
 * Lo llaman `playwright.config.ts` (antes de compilar) y `preparar.ts` (antes
 * de migrar y cargar el seed). Si algo no coincide, no se arranca.
 */
export const BASE_DESCARTABLE = "pulso_e2e";

function destino(variable: "DATABASE_URL" | "DIRECT_URL"): string {
  const valor = process.env[variable];
  if (!valor) throw new Error(`Las pruebas e2e necesitan ${variable} (ver .env.e2e).`);

  const url = new URL(valor);
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error(`Las pruebas e2e solo corren contra una base local, y ${variable} apunta a ${url.hostname}.`);
  }
  const base = url.pathname.replace(/^\//, "");
  if (base !== BASE_DESCARTABLE) {
    throw new Error(
      `Las pruebas e2e solo corren contra la base descartable "${BASE_DESCARTABLE}", y ${variable} apunta a "${base}".`,
    );
  }
  return `${url.hostname}:${url.port || "5432"}/${base}`;
}

export function exigirBaseLocal(): void {
  const app = destino("DATABASE_URL");
  const migraciones = destino("DIRECT_URL");
  if (app !== migraciones) {
    throw new Error(`DATABASE_URL (${app}) y DIRECT_URL (${migraciones}) tienen que ser la misma base de pruebas.`);
  }
}
