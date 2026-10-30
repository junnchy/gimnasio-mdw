import type { Motivo } from "@/lib/reglas";
import type { CodigoRechazoReserva, CodigoRechazoCancelacion } from "@/lib/reserva";
import type { CodigoRechazoEscaneo } from "@/lib/visita";
import { esDuplicado } from "@/lib/db/errores";
import { OperacionConcurrente } from "@/lib/db/operacionSocio";

type Codigo = CodigoRechazoReserva | CodigoRechazoCancelacion | CodigoRechazoEscaneo
  | "RESERVA_DUPLICADA" | "VISITA_ABIERTA_DUPLICADA" | "OPERACION_CONCURRENTE";

export type Rechazo = { ok: false; tipo: "NO_ENCONTRADO"; mensaje: string }
  | { ok: false; tipo: "CONFLICTO"; motivos: readonly Motivo<Codigo>[] };
export type Resultado<T> = { ok: true; dato: T } | Rechazo;

export function rechazo(motivos: readonly Motivo<Codigo>[]): Rechazo {
  return { ok: false, tipo: "CONFLICTO", motivos };
}

export function errorDeOperacion(error: unknown, duplicado: "RESERVA_DUPLICADA" | "VISITA_ABIERTA_DUPLICADA"): Rechazo {
  if (esDuplicado(error)) return rechazo([{
    codigo: duplicado,
    mensaje: duplicado === "RESERVA_DUPLICADA" ? "Ya tenés una reserva confirmada para esta clase." : "Ya tenés una visita abierta.",
  }]);
  if (error instanceof OperacionConcurrente) return rechazo([{
    codigo: "OPERACION_CONCURRENTE", mensaje: "Hubo otra operación al mismo tiempo. Revisá el estado y volvé a intentar.",
  }]);
  throw error;
}
