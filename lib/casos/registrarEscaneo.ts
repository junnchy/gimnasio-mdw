import { operarSocio, type DatosSocio } from "@/lib/db/operacionSocio";
import { estadoMembresiaVista } from "@/lib/membresia";
import { duracionDeVisita, puedeEscanear } from "@/lib/visita";
import { errorDeOperacion, rechazo, type Resultado } from "./resultado";

type VisitaRegistrada = Awaited<ReturnType<DatosSocio["ingresar"]>> & { duracionMin: number | null };

export async function registrarEscaneo(socioId: string, qrToken: string): Promise<Resultado<VisitaRegistrada>> {
  try {
    return await operarSocio(socioId, async (datos): Promise<Resultado<VisitaRegistrada>> => {
      const ahora = new Date();
      const abierta = await datos.visitaAbierta();
      const membresia = await datos.membresia();
      const veredicto = puedeEscanear({
        estadoMembresia: membresia ? estadoMembresiaVista(membresia, ahora) : null,
        token: qrToken, tokenEsperado: process.env.QR_TOKEN ?? "",
        ultimoMovimientoAt: await datos.ultimoMovimiento(), hayVisitaAbierta: abierta !== null,
      }, ahora);
      if (!veredicto.ok) return rechazo(veredicto.motivos);
      const visita = abierta ? await datos.salir(abierta.id, ahora) : await datos.ingresar(ahora);
      return { ok: true, dato: { ...visita, duracionMin: duracionDeVisita(visita) } };
    });
  } catch (error) {
    return errorDeOperacion(error, "VISITA_ABIERTA_DUPLICADA");
  }
}
