import { reservarClase } from "@/lib/casos/reservarClase";
import { respuestaRechazo } from "@/lib/respuestaOperacion";
import { NextRequest, NextResponse } from "next/server";
import { listarReservasDeSocio } from "@/lib/db/reservas";
import { reservaSchema } from "@/lib/schemas/reserva";
import { limiteLista } from "@/lib/schemas/_common";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { datosInvalidos, parametrosInvalidos } from "@/lib/http";
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
    const resultado = reservaSchema.pick({ claseId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    const operacion = await reservarClase(socio.id, resultado.data.claseId);
    if (!operacion.ok) return respuestaRechazo(operacion);
    return NextResponse.json(operacion.dato, { status: 201 });
  } catch (error) {
    return responderError("POST /api/reservas", error);
  }
}
