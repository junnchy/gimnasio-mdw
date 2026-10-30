import { operarSocio, type DatosSocio } from "@/lib/db/operacionSocio";
import { estadoMembresiaVista } from "@/lib/membresia";
import { puedeReservar } from "@/lib/reserva";
import { errorDeOperacion, rechazo, type Resultado } from "./resultado";

type ReservaCreada = Awaited<ReturnType<DatosSocio["reservar"]>>;

export async function reservarClase(socioId: string, claseId: string): Promise<Resultado<ReservaCreada>> {
  try {
    return await operarSocio(socioId, async (datos): Promise<Resultado<ReservaCreada>> => {
      const ahora = new Date();
      const clase = await datos.clase(claseId);
      if (!clase) return { ok: false, tipo: "NO_ENCONTRADO", mensaje: "Clase no encontrada" };
      const membresia = await datos.membresia();
      const veredicto = puedeReservar({
        estadoMembresia: membresia ? estadoMembresiaVista(membresia, ahora) : null,
        clase, reservasVigentes: await datos.reservas(clase),
      }, ahora);
      if (!veredicto.ok) return rechazo(veredicto.motivos);
      return { ok: true, dato: await datos.reservar(claseId) };
    });
  } catch (error) {
    return errorDeOperacion(error, "RESERVA_DUPLICADA");
  }
}
