import { NoAutorizado } from "@/lib/errores";
import type { RolUsuario } from "@/lib/schemas/_common";

/**
 * Para las consultas que devuelven datos de TODOS los socios (pantallas de
 * staff). La página ya verificó el rol; esto es la segunda llave, por si
 * alguien reutiliza el listado en otra pantalla y se olvida del chequeo:
 * lanzar rompe la pantalla (error.tsx) en vez de mostrar datos ajenos.
 */
export function exigirAdmin(usuario: { rol: RolUsuario }): void {
  if (usuario.rol !== "ADMIN") throw new NoAutorizado();
}
