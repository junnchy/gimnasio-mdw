import { NextRequest, NextResponse } from "next/server";
import { crearClase, listarClases } from "@/lib/db/clases";
import { claseSchema } from "@/lib/schemas/clase";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { leerBody } from "@/lib/utils";
import { limiteLista } from "@/lib/schemas/_common";

export async function GET(request: NextRequest) {
  const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
  if (!resultado.success) return NextResponse.json({ error: "Parámetros inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  return NextResponse.json(await listarClases(resultado.data));
}

export async function POST(request: Request) {
  const resultado = claseSchema.omit({ profesorId: true }).safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): profesorId sale de la sesión y se verifica rol PROFESOR.
  return NextResponse.json(await crearClase(resultado.data, await usuarioDeEjemplo("PROFESOR")), { status: 201 });
}
