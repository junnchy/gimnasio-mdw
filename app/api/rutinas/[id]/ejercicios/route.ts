import { NextResponse } from "next/server";
import { agregarEjercicioARutina } from "@/lib/db/rutinas";
import { id } from "@/lib/schemas/_common";
import { rutinaEjercicioSchema } from "@/lib/schemas/rutinaEjercicio";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { esDuplicado } from "@/lib/db/errores";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Contexto) {
  const { id: rutinaId } = await params;
  if (!id.safeParse(rutinaId).success) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const resultado = rutinaEjercicioSchema.omit({ rutinaId: true }).safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  try {
    const item = await agregarEjercicioARutina({ ...resultado.data, rutinaId }, await usuarioDeEjemplo("PROFESOR"));
    return item ? NextResponse.json(item, { status: 201 }) : NextResponse.json({ error: "Rutina o ejercicio no encontrado" }, { status: 404 });
  } catch (error) {
    if (esDuplicado(error)) return NextResponse.json({ error: "El ejercicio ya está en esta rutina" }, { status: 409 });
    throw error;
  }
}
