import { NextResponse } from "next/server";
import { marcarAsistencia, obtenerReserva } from "@/lib/db/reservas";
import { id } from "@/lib/schemas/_common";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  const { id: reservaId } = await params;
  if (!id.safeParse(reservaId).success) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const reserva = await obtenerReserva(reservaId);
  if (!reserva) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const profesorId = await usuarioDeEjemplo("PROFESOR");
  if (reserva.clase.profesorId !== profesorId) return NextResponse.json({ error: "No autorizada" }, { status: 403 });
  // TODO (clase 5): permitir solo después de que la clase fue dictada.
  if (reserva.estado !== "CONFIRMADA") return NextResponse.json({ error: "La reserva no está confirmada" }, { status: 409 });
  await marcarAsistencia(reservaId, profesorId);
  return NextResponse.json({ id: reservaId, presente: true });
}
