import { operarSocio, type DatosSocio } from "@/lib/db/operacionSocio";
import { puedeCancelar } from "@/lib/reserva";
import { errorDeOperacion, rechazo, type Resultado } from "./resultado";

type ReservaCancelada = NonNullable<Awaited<ReturnType<DatosSocio["cancelar"]>>>;

export async function cancelarReservaPropia(socioId: string, reservaId: string): Promise<Resultado<ReservaCancelada>> {
  try {
    return await operarSocio(socioId, async (datos): Promise<Resultado<ReservaCancelada>> => {
      const reserva = await datos.reserva(reservaId);
      if (!reserva) return { ok: false, tipo: "NO_ENCONTRADO", mensaje: "Reserva no encontrada" };
      const veredicto = puedeCancelar({ estado: reserva.estado, claseInicio: reserva.clase.inicio }, new Date());
      if (!veredicto.ok) return rechazo(veredicto.motivos);
      const cancelada = await datos.cancelar(reservaId);
      if (!cancelada) return rechazo([{ codigo: "RESERVA_NO_CONFIRMADA", mensaje: "La reserva no está confirmada." }]);
      return { ok: true, dato: cancelada };
    });
  } catch (error) {
    return errorDeOperacion(error, "RESERVA_DUPLICADA");
  }
}
