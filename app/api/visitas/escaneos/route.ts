import { NextResponse } from "next/server";
import { abrirVisita, cerrarVisita, ultimoMovimientoDelSocio, visitaAbiertaDelSocio } from "@/lib/db/visitas";
import { obtenerMembresiaActual } from "@/lib/db/membresias";
import { esDuplicado } from "@/lib/db/errores";
import { estadoMembresiaVista } from "@/lib/membresia";
import { accionDeEscaneo, duracionDeVisita, puedeEscanear } from "@/lib/visita";
import { registrarEscaneoSchema } from "@/lib/schemas/escaneo";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { conflicto, conflictoSimple, datosInvalidos, errorInesperado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const resultado = registrarEscaneoSchema.omit({ socioId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());

    // TODO (clase 6): socioId sale de sesión.
    const socioId = await usuarioDeEjemplo("SOCIO");
    const ahora = new Date();

    const membresia = await obtenerMembresiaActual(socioId);
    const veredicto = puedeEscanear(
      {
        estadoMembresia: membresia ? estadoMembresiaVista(membresia, ahora) : null,
        token: resultado.data.qrToken,
        tokenEsperado: process.env.QR_TOKEN ?? "",
        ultimoMovimientoAt: await ultimoMovimientoDelSocio(socioId),
      },
      ahora,
    );
    if (!veredicto.ok) return conflicto(veredicto);

    // El mismo QR abre o cierra: lo decide el servidor según el estado del
    // socio, no el cliente (flujo §5).
    const abierta = await visitaAbiertaDelSocio(socioId);
    if (accionDeEscaneo(abierta !== null) === "ABRIR") {
      return NextResponse.json({ ...(await abrirVisita(socioId, ahora)), duracionMin: null }, { status: 201 });
    }

    const cerrada = await cerrarVisita(abierta!.id, ahora);
    return NextResponse.json({ ...cerrada, duracionMin: duracionDeVisita(cerrada) });
  } catch (error) {
    // El índice único parcial sobre (socioId) WHERE estado = 'ABIERTA' corta
    // dos escaneos simultáneos que hayan pasado el debounce.
    if (esDuplicado(error)) {
      return conflictoSimple("Ya tenés una visita abierta.", "VISITA_ABIERTA_DUPLICADA");
    }
    return errorInesperado(error);
  }
}
