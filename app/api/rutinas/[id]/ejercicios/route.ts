import { NextResponse } from "next/server";
import { agregarEjercicioARutina } from "@/lib/db/rutinas";
import { esDuplicado } from "@/lib/db/errores";
import { id } from "@/lib/schemas/_common";
import { rutinaEjercicioSchema } from "@/lib/schemas/rutinaEjercicio";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { conflictoSimple, datosInvalidos, errorInesperado, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Contexto) {
  try {
    const { id: rutinaId } = await params;
    if (!id.safeParse(rutinaId).success) return noEncontrado("Rutina no encontrada");
    const resultado = rutinaEjercicioSchema.omit({ rutinaId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): el profesor sale de la sesión.
    const item = await agregarEjercicioARutina(
      { ...resultado.data, rutinaId },
      await usuarioDeEjemplo("PROFESOR"),
    );
    return item
      ? NextResponse.json(item, { status: 201 })
      : noEncontrado("Rutina o ejercicio no encontrado");
  } catch (error) {
    if (esDuplicado(error)) {
      return conflictoSimple("El ejercicio ya está en esta rutina", "EJERCICIO_EN_RUTINA");
    }
    return errorInesperado(error);
  }
}
