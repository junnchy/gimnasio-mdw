/**
 * Las pruebas e2e escriben en la base: cargan el seed, escanean el QR,
 * reservan. Nunca pueden correr contra la de producción.
 *
 * Lo llaman `playwright.config.ts` (antes de compilar) y `preparar.ts` (antes
 * de migrar y cargar el seed): si DATABASE_URL no es local, no se arranca.
 */
export function exigirBaseLocal(): void {
  for (const variable of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const valor = process.env[variable];
    if (!valor) throw new Error(`Las pruebas e2e necesitan ${variable} (ver .env.e2e).`);
    const host = new URL(valor).hostname;
    if (!["localhost", "127.0.0.1"].includes(host)) {
      throw new Error(`Las pruebas e2e solo corren contra una base local, y ${variable} apunta a ${host}.`);
    }
  }
}
