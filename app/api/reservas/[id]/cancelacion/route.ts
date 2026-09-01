import { NextResponse } from "next/server";
import { cancelarReserva, obtenerReserva } from "@/lib/db/reservas";
import { id } from "@/lib/schemas/_common";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Contexto) {
  const { id: reservaId } = await params;
  if (!id.safeParse(reservaId).success) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const reserva = await obtenerReserva(reservaId);
  const socioId = await usuarioDeEjemplo("SOCIO");
  if (!reserva || reserva.socioId !== socioId) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  // TODO (clase 5): rechazar si la clase ya empezó.
  if (!(await cancelarReserva(reservaId, socioId))) return NextResponse.json({ error: "La reserva no puede cancelarse" }, { status: 409 });
  return NextResponse.json({ id: reservaId, estado: "CANCELADA" });
}
