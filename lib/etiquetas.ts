/**
 * Cómo se muestra cada valor de los enums en la pantalla (clase 10).
 *
 * `Record<RolUsuario, string>` obliga a tener UNA etiqueta por cada valor: si
 * mañana se agrega un rol al enum, esto deja de compilar hasta que alguien
 * decida cómo se llama. Un ternario (`rol === "SOCIO" ? "Socio" : "Profesor"`)
 * compilaría igual y mostraría "Profesor" para el rol nuevo, sin avisar.
 */
import type { RolUsuario } from "@/lib/schemas/_common";

export const NOMBRE_ROL: Record<RolUsuario, string> = {
  ADMIN: "Administración",
  PROFESOR: "Profesor",
  SOCIO: "Socio",
};
