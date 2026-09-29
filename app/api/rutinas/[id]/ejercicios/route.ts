import { NextResponse } from "next/server";
import { agregarEjercicioARutina } from "@/lib/db/rutinas";
import { esDuplicado } from "@/lib/db/errores";
import { id } from "@/lib/schemas/_common";
import { rutinaEjercicioSchema } from "@/lib/schemas/rutinaEjercicio";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflictoSimple, datosInvalidos, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Contexto) {
  try {
    const profesor = await requerirUsuario("PROFESOR");
    const { id: rutinaId } = await params;
    if (!id.safeParse(rutinaId).success) return noEncontrado("Rutina no encontrada");
    const resultado = rutinaEjercicioSchema.omit({ rutinaId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // La rutina se busca con el profesorId en el WHERE: la de otro profesor → 404.
    const item = await agregarEjercicioARutina(
      { ...resultado.data, rutinaId },
      profesor.id,
    );
    return item
      ? NextResponse.json(item, { status: 201 })
      : noEncontrado("Rutina o ejercicio no encontrado");
  } catch (error) {
    if (esDuplicado(error)) {
      return conflictoSimple("El ejercicio ya está en esta rutina", "EJERCICIO_EN_RUTINA");
    }
    return responderError("POST /api/rutinas/:id/ejercicios", error);
  }
}
