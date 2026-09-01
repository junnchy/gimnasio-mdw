import { NextResponse } from "next/server";
import { crearReserva, listarReservasDeSocio } from "@/lib/db/reservas";
import { reservaSchema } from "@/lib/schemas/reserva";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

export async function GET() {
  // TODO (clase 6): socioId sale de sesión.
  return NextResponse.json(await listarReservasDeSocio(await usuarioDeEjemplo("SOCIO")));
}

export async function POST(request: Request) {
  const resultado = reservaSchema.pick({ claseId: true }).safeParse(await request.json() as unknown);
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 5): validar membresía, cupo y solapamiento antes de crear.
  const reserva = await crearReserva(resultado.data.claseId, await usuarioDeEjemplo("SOCIO"));
  return reserva ? NextResponse.json(reserva, { status: 201 }) : NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
}
