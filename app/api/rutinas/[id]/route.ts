import { NextResponse } from "next/server";
import { actualizarRutina } from "@/lib/db/rutinas";
import { id } from "@/lib/schemas/_common";
import { rutinaSchema } from "@/lib/schemas/rutina";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Contexto) {
  const { id: rutinaId } = await params;
  if (!id.safeParse(rutinaId).success) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const resultado = rutinaSchema.omit({ profesorId: true, socioId: true }).partial().safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  const rutina = await actualizarRutina(rutinaId, resultado.data, await usuarioDeEjemplo("PROFESOR"));
  return rutina ? NextResponse.json(rutina) : NextResponse.json({ error: "No encontrada" }, { status: 404 });
}
