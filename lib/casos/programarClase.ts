import { crearClase } from "@/lib/db/clases";
import type { Clase } from "@/lib/schemas/clase";

/**
 * Programar una clase (PROFESOR): lo comparten `POST /api/clases` y la
 * pantalla /clases/nueva. Quien llama ya verificó el rol y validó los datos;
 * el `profesorId` es siempre el de la sesión, nunca uno que mande el cliente.
 */
export async function programarClase(profesorId: string, datos: Omit<Clase, "profesorId">) {
  return crearClase(datos, profesorId);
}
