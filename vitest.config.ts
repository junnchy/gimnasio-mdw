import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

/**
 * Vitest corre las pruebas de dominio y de integración (`*.test.ts`).
 *
 * Las `*.spec.ts` de `e2e/` son de Playwright: necesitan la app levantada y se corren con
 * `npm run test:e2e`. Sin esta exclusión, vitest las agarraría por el nombre
 * (`*.spec.ts`) y fallarían por no tener dónde correr.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd()) } },
  test: { exclude: [...configDefaults.exclude, "e2e/**/*.spec.ts"] },
});
