import { NextResponse } from "next/server";
import { cancelarReserva, obtenerReserva } from "@/lib/db/reservas";
import { puedeCancelar } from "@/lib/reserva";
import { id } from "@/lib/schemas/_common";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { conflicto, errorInesperado, noEncontrado } from "@/lib/http";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const { id: reservaId } = await params;
    if (!id.safeParse(reservaId).success) return noEncontrado("Reserva no encontrada");

    // TODO (clase 6): socioId sale de sesión.
    const socioId = await usuarioDeEjemplo("SOCIO");
    const reserva = await obtenerReserva(reservaId);

    // Una reserva de otro socio no existe para este socio: 404, no 403, para
    // no revelar que el id es válido.
    if (!reserva || reserva.socioId !== socioId) return noEncontrado("Reserva no encontrada");

    const veredicto = puedeCancelar(
      { estado: reserva.estado, claseInicio: reserva.clase.inicio },
      new Date(),
    );
    if (!veredicto.ok) return conflicto(veredicto);

    const cancelada = await cancelarReserva(reservaId);
    return NextResponse.json({ id: cancelada.id, estado: cancelada.estado });
  } catch (error) {
    return errorInesperado(error);
  }
}
