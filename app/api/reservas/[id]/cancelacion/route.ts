import { NextResponse } from "next/server";
import { cancelarReserva, obtenerReservaDeSocio } from "@/lib/db/reservas";
import { puedeCancelar } from "@/lib/reserva";
import { id } from "@/lib/schemas/_common";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflicto, noEncontrado } from "@/lib/http";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const socio = await requerirUsuario("SOCIO");
    const { id: reservaId } = await params;
    if (!id.safeParse(reservaId).success) return noEncontrado("Reserva no encontrada");

    // El id del socio va en el WHERE: una reserva ajena no existe para este
    // socio. 404 y no 403, para no revelar que el id es válido.
    const reserva = await obtenerReservaDeSocio(reservaId, socio.id);
    if (!reserva) return noEncontrado("Reserva no encontrada");

    const veredicto = puedeCancelar(
      { estado: reserva.estado, claseInicio: reserva.clase.inicio },
      new Date(),
    );
    if (!veredicto.ok) return conflicto(veredicto);

    // La escritura vuelve a filtrar por socio y por CONFIRMADA: si otra
    // request la canceló en el medio, no se pisa nada.
    const cancelada = await cancelarReserva(reservaId, socio.id);
    if (!cancelada) return noEncontrado("Reserva no encontrada");
    return NextResponse.json({ id: cancelada.id, estado: cancelada.estado });
  } catch (error) {
    return responderError("POST /api/reservas/:id/cancelacion", error);
  }
}
