import { NextRequest, NextResponse } from "next/server";
import { claseParaReservar, crearReserva, listarReservasDeSocio, reservasVigentesDelSocio } from "@/lib/db/reservas";
import { obtenerMembresiaActual } from "@/lib/db/membresias";
import { esDuplicado } from "@/lib/db/errores";
import { estadoMembresiaVista } from "@/lib/membresia";
import { puedeReservar } from "@/lib/reserva";
import { reservaSchema } from "@/lib/schemas/reserva";
import { limiteLista } from "@/lib/schemas/_common";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { conflicto, conflictoSimple, datosInvalidos, errorInesperado, noEncontrado, parametrosInvalidos } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // TODO (clase 6): socioId sale de sesión.
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarReservasDeSocio(await usuarioDeEjemplo("SOCIO"), resultado.data));
  } catch (error) {
    return errorInesperado(error);
  }
}

export async function POST(request: Request) {
  try {
    const resultado = reservaSchema.pick({ claseId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());

    // TODO (clase 6): socioId sale de sesión.
    const socioId = await usuarioDeEjemplo("SOCIO");
    const ahora = new Date();

    const clase = await claseParaReservar(resultado.data.claseId);
    if (!clase) return noEncontrado("Clase no encontrada");

    const membresia = await obtenerMembresiaActual(socioId);
    const veredicto = puedeReservar(
      {
        estadoMembresia: membresia ? estadoMembresiaVista(membresia, ahora) : null,
        clase,
        reservasVigentes: await reservasVigentesDelSocio(socioId),
      },
      ahora,
    );
    if (!veredicto.ok) return conflicto(veredicto);

    return NextResponse.json(await crearReserva(clase.id, socioId), { status: 201 });
  } catch (error) {
    // El índice único parcial es la última línea de defensa: dos requests
    // simultáneos pasan la regla y solo uno entra.
    if (esDuplicado(error)) {
      return conflictoSimple("Ya tenés una reserva confirmada para esta clase.", "RESERVA_DUPLICADA");
    }
    return errorInesperado(error);
  }
}
