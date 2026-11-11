/** Dónde quedan las sesiones, el QR y los datos de prueba que arma `preparar.ts`. */
import path from "node:path";

const carpeta = path.join(__dirname, ".sesiones");

export const SESION = {
  socio: path.join(carpeta, "socio.json"),
  socioVencido: path.join(carpeta, "socio-vencido.json"),
  otroSocio: path.join(carpeta, "otro-socio.json"),
  profesor: path.join(carpeta, "profesor.json"),
  otroProfesor: path.join(carpeta, "otro-profesor.json"),
  admin: path.join(carpeta, "admin.json"),
} as const;

/** La imagen del QR de la puerta, con el `QR_TOKEN` de `.env.e2e`. */
export const QR_DE_LA_PUERTA = path.join(carpeta, "qr-puerta.png");

/** Los ids que las pruebas necesitan conocer (lo que `preparar.ts` creó o encontró). */
export const DATOS = path.join(carpeta, "datos.json");

export type DatosDePrueba = {
  claseId: string;
  reservaId: string;
  rutinaId: string;
  ejercicioId: string;
  planId: string;
};

/** Las personas de las pruebas. Las que no están en el seed las crea `preparar.ts`. */
export const PERSONAS = {
  socio: { email: "socia-e2e@ejemplo.com", nombre: "Lucía Prueba" },
  socioVencido: { email: "socio-vencido@ejemplo.com" },
  otroSocio: { email: "otro-socio-e2e@ejemplo.com", nombre: "Otro Socio" },
  profesor: { email: "profe@ejemplo.com" },
  otroProfesor: { email: "otro-profe-e2e@ejemplo.com", nombre: "Otra Profe" },
  admin: { email: "admin@ejemplo.com" },
} as const;
