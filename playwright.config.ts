/**
 * Las pruebas de punta a punta (clases 13 y 14): el sistema entero, como lo
 * usa una persona o un programa desde afuera.
 *
 * Levanta la app compilada (`next build` + `next start`, lo mismo que corre en
 * Vercel) contra una base local y le pega por HTTP o con un navegador.
 *
 *   npm test           dominio e integración, sin levantar la app (vitest)
 *   npm run test:e2e   el sistema entero, con base y servidor (esto)
 */
import path from "node:path";
import { config as cargarEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Las variables del CI ganan: dotenv no pisa lo que ya está definido.
cargarEnv({ path: path.join(__dirname, ".env.e2e"), quiet: true });

/**
 * El cinturón de seguridad. Estas pruebas reservan clases y crean socios:
 * corridas contra la base de producción, dejarían datos falsos en pantallas
 * reales. Si la base no es local, no se arranca.
 */
const base = new URL(process.env.DATABASE_URL ?? "postgresql://sin-definir");
if (!["localhost", "127.0.0.1"].includes(base.hostname)) {
  throw new Error(`Las pruebas e2e solo corren contra una base local, y DATABASE_URL apunta a ${base.hostname}.`);
}

const PUERTO = 3100;

export default defineConfig({
  testDir: "e2e",

  // Una sola base para todas las pruebas: en fila, no en paralelo. Lo que
  // corre en paralelo son los pedidos DENTRO de una prueba (concurrencia).
  workers: 1,
  fullyParallel: false,

  // En CI se reintenta una vez; si pasa al segundo intento, el reporte la
  // marca como "flaky": no es verde, es una prueba que hay que mirar.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",

  globalSetup: "./e2e/preparar.ts",

  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: "retain-on-failure",
  },

  projects: [{ name: "escritorio", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: `npm run build && npx next start --port ${PUERTO}`,
    url: `http://localhost:${PUERTO}/ingresar`,
    reuseExistingServer: false,
    timeout: 300_000,
    // En otra carpeta que la de `npm run dev`: compilar encima de un servidor
    // de desarrollo que está corriendo lo rompe.
    env: { NEXT_DIST_DIR: ".next-e2e" },
  },
});
