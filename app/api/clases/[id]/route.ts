import { NextResponse } from "next/server";
import { actualizarClase, obtenerClase } from "@/lib/db/clases";
import { id } from "@/lib/schemas/_common";
import { claseSchema } from "@/lib/schemas/clase";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  const { id: claseId } = await params;
  if (!id.safeParse(claseId).success) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const clase = await obtenerClase(claseId);
  return clase ? NextResponse.json(clase) : NextResponse.json({ error: "No encontrada" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Contexto) {
  const { id: claseId } = await params;
  if (!id.safeParse(claseId).success) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const resultado = claseSchema.omit({ profesorId: true }).partial().safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): verificar profesor de sesión.
  const clase = await actualizarClase(claseId, resultado.data, await usuarioDeEjemplo("PROFESOR"));
  return clase ? NextResponse.json(clase) : NextResponse.json({ error: "No encontrada" }, { status: 404 });
}
