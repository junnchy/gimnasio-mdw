import { NextRequest, NextResponse } from "next/server";
import { crearReserva, listarReservasDeSocio } from "@/lib/db/reservas";
import { reservaSchema } from "@/lib/schemas/reserva";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { esDuplicado } from "@/lib/db/errores";
import { leerBody } from "@/lib/utils";
import { limiteLista } from "@/lib/schemas/_common";

export async function GET(request: NextRequest) {
  // TODO (clase 6): socioId sale de sesión.
  const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
  if (!resultado.success) return NextResponse.json({ error: "Parámetros inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  return NextResponse.json(await listarReservasDeSocio(await usuarioDeEjemplo("SOCIO"), resultado.data));
}

export async function POST(request: Request) {
  const resultado = reservaSchema.pick({ claseId: true }).safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 5): validar membresía, cupo y solapamiento antes de crear.
  try {
    const reserva = await crearReserva(resultado.data.claseId, await usuarioDeEjemplo("SOCIO"));
    return reserva ? NextResponse.json(reserva, { status: 201 }) : NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  } catch (error) {
    if (esDuplicado(error)) return NextResponse.json({ error: "Ya existe una reserva confirmada para esta clase" }, { status: 409 });
    throw error;
  }
}
