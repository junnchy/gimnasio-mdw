/** Dónde quedan las sesiones de prueba que arma `preparar.ts`, una por rol del seed. */
import path from "node:path";

const carpeta = path.join(__dirname, ".sesiones");

export const SESION = {
  socio: path.join(carpeta, "socio.json"),
  profesor: path.join(carpeta, "profesor.json"),
  admin: path.join(carpeta, "admin.json"),
} as const;
