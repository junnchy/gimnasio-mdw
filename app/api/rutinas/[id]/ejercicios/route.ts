import { NextResponse } from "next/server";
import { agregarEjercicioARutina } from "@/lib/db/rutinas";
import { id } from "@/lib/schemas/_common";
import { rutinaEjercicioSchema } from "@/lib/schemas/rutinaEjercicio";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Contexto) {
  const { id: rutinaId } = await params;
  if (!id.safeParse(rutinaId).success) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const resultado = rutinaEjercicioSchema.omit({ rutinaId: true }).safeParse(await request.json() as unknown);
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  const item = await agregarEjercicioARutina({ ...resultado.data, rutinaId }, await usuarioDeEjemplo("PROFESOR"));
  return item ? NextResponse.json(item, { status: 201 }) : NextResponse.json({ error: "Rutina o ejercicio no encontrado" }, { status: 404 });
}
