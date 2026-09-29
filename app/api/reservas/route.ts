import { NextRequest, NextResponse } from "next/server";
import { claseParaReservar, crearReserva, listarReservasDeSocio, reservasVigentesDelSocio } from "@/lib/db/reservas";
import { obtenerMembresiaActual } from "@/lib/db/membresias";
import { esDuplicado } from "@/lib/db/errores";
import { estadoMembresiaVista } from "@/lib/membresia";
import { puedeReservar } from "@/lib/reserva";
import { reservaSchema } from "@/lib/schemas/reserva";
import { limiteLista } from "@/lib/schemas/_common";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflicto, conflictoSimple, datosInvalidos, noEncontrado, parametrosInvalidos } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const socio = await requerirUsuario("SOCIO");
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarReservasDeSocio(socio.id, resultado.data));
  } catch (error) {
    return responderError("GET /api/reservas", error);
  }
}

export async function POST(request: Request) {
  try {
    const socio = await requerirUsuario("SOCIO");
    // Solo `claseId`: el socio sale de la sesión, nunca del body.
    const resultado = reservaSchema.pick({ claseId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());

    const ahora = new Date();

    const clase = await claseParaReservar(resultado.data.claseId);
    if (!clase) return noEncontrado("Clase no encontrada");

    const membresia = await obtenerMembresiaActual(socio.id);
    const veredicto = puedeReservar(
      {
        estadoMembresia: membresia ? estadoMembresiaVista(membresia, ahora) : null,
        clase,
        reservasVigentes: await reservasVigentesDelSocio(socio.id),
      },
      ahora,
    );
    if (!veredicto.ok) return conflicto(veredicto);

    return NextResponse.json(await crearReserva(clase.id, socio.id), { status: 201 });
  } catch (error) {
    // El índice único parcial es la última línea de defensa: dos requests
    // simultáneos pasan la regla y solo uno entra.
    if (esDuplicado(error)) {
      return conflictoSimple("Ya tenés una reserva confirmada para esta clase.", "RESERVA_DUPLICADA");
    }
    return responderError("POST /api/reservas", error);
  }
}
