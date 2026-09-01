import { obtenerIdUsuarioDeEjemplo } from "@/lib/db/usuarios";

// TODO (clase 6): reemplazar por la sesión real de Auth.js.
export function usuarioDeEjemplo(rol: "ADMIN" | "PROFESOR" | "SOCIO") {
  return obtenerIdUsuarioDeEjemplo(rol);
}
