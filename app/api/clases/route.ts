import { NextResponse } from "next/server";
import { crearClase, listarClases } from "@/lib/db/clases";
import { claseSchema } from "@/lib/schemas/clase";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

export async function GET() { return NextResponse.json(await listarClases()); }

export async function POST(request: Request) {
  const resultado = claseSchema.omit({ profesorId: true }).safeParse(await request.json() as unknown);
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): profesorId sale de la sesión y se verifica rol PROFESOR.
  return NextResponse.json(await crearClase(resultado.data, await usuarioDeEjemplo("PROFESOR")), { status: 201 });
}
