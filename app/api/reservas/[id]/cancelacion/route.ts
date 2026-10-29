import { NextResponse } from "next/server";
import { cancelarReservaPropia } from "@/lib/casos/cancelarReserva";
import { respuestaRechazo } from "@/lib/respuestaOperacion";
import { id } from "@/lib/schemas/_common";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { noEncontrado } from "@/lib/http";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const socio = await requerirUsuario("SOCIO");
    const { id: reservaId } = await params;
    if (!id.safeParse(reservaId).success) return noEncontrado("Reserva no encontrada");
    const operacion = await cancelarReservaPropia(socio.id, reservaId);
    if (!operacion.ok) return respuestaRechazo(operacion);
    return NextResponse.json({ id: operacion.dato.id, estado: operacion.dato.estado });
  } catch (error) {
    return responderError("POST /api/reservas/:id/cancelacion", error);
  }
}
