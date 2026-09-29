import { NextResponse } from "next/server";
import { marcarAsistencia, obtenerReserva } from "@/lib/db/reservas";
import { puedeMarcarAsistencia } from "@/lib/reserva";
import { id } from "@/lib/schemas/_common";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflicto, noEncontrado, prohibido } from "@/lib/http";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  try {
    const profesor = await requerirUsuario("PROFESOR");
    const { id: reservaId } = await params;
    if (!id.safeParse(reservaId).success) return noEncontrado("Reserva no encontrada");

    const reserva = await obtenerReserva(reservaId);
    if (!reserva) return noEncontrado("Reserva no encontrada");

    // Decisión del contrato (docs/api.md): acá es 403 y no 404, porque las
    // clases son visibles para cualquier rol con sesión. Lo que falta no es
    // el recurso, es el permiso sobre él.
    if (reserva.clase.profesorId !== profesor.id) return prohibido("La clase no es tuya");

    const veredicto = puedeMarcarAsistencia(
      {
        estado: reserva.estado,
        claseInicio: reserva.clase.inicio,
        claseDuracionMin: reserva.clase.duracionMin,
      },
      new Date(),
    );
    if (!veredicto.ok) return conflicto(veredicto);

    // La escritura vuelve a exigir el profesorId en el WHERE: el `if` de
    // arriba elige el status, pero no es lo único que protege el dato.
    const marcada = await marcarAsistencia(reservaId, profesor.id);
    if (!marcada) return noEncontrado("Reserva no encontrada");
    return NextResponse.json({ id: marcada.id, presente: marcada.presente });
  } catch (error) {
    return responderError("POST /api/reservas/:id/asistencia", error);
  }
}
