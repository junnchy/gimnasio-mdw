import { conflicto, noEncontrado } from "@/lib/http";
import type { Rechazo } from "@/lib/casos/resultado";

export function respuestaRechazo(resultado: Rechazo) {
  return resultado.tipo === "NO_ENCONTRADO" ? noEncontrado(resultado.mensaje) : conflicto(resultado);
}
