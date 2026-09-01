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
  // TODO (clase 5): permitir solo después de que la clase fue dictada.
  if (!(await marcarAsistencia(reservaId, await usuarioDeEjemplo("PROFESOR")))) return NextResponse.json({ error: "No autorizada o no confirmada" }, { status: 409 });
  return NextResponse.json({ id: reservaId, presente: true });
}
