import { NextResponse } from "next/server";
import { marcarAsistencia, obtenerReserva } from "@/lib/db/reservas";
import { puedeMarcarAsistencia } from "@/lib/reserva";
import { id } from "@/lib/schemas/_common";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { conflicto, errorInesperado, noEncontrado, prohibido } from "@/lib/http";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const { id: reservaId } = await params;
    if (!id.safeParse(reservaId).success) return noEncontrado("Reserva no encontrada");

    const reserva = await obtenerReserva(reservaId);
    if (!reserva) return noEncontrado("Reserva no encontrada");

    // TODO (clase 6): el profesor sale de la sesión y se verifica el rol.
    const profesorId = await usuarioDeEjemplo("PROFESOR");
    // La reserva existe y es visible, pero no es de su clase: acá sí es 403.
    if (reserva.clase.profesorId !== profesorId) return prohibido("La clase no es tuya");

    const veredicto = puedeMarcarAsistencia(
      {
        estado: reserva.estado,
        claseInicio: reserva.clase.inicio,
        claseDuracionMin: reserva.clase.duracionMin,
      },
      new Date(),
    );
    if (!veredicto.ok) return conflicto(veredicto);

    const marcada = await marcarAsistencia(reservaId);
    return NextResponse.json({ id: marcada.id, presente: marcada.presente });
  } catch (error) {
    return errorInesperado(error);
  }
}
