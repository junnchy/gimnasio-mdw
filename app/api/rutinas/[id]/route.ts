import { NextResponse } from "next/server";
import { actualizarRutina } from "@/lib/db/rutinas";
import { id } from "@/lib/schemas/_common";
import { rutinaSchema } from "@/lib/schemas/rutina";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { datosInvalidos, errorInesperado, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Contexto) {
  try {
    const { id: rutinaId } = await params;
    if (!id.safeParse(rutinaId).success) return noEncontrado("Rutina no encontrada");
    const resultado = rutinaSchema.omit({ profesorId: true, socioId: true }).partial().safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): el profesor sale de la sesión.
    const rutina = await actualizarRutina(rutinaId, resultado.data, await usuarioDeEjemplo("PROFESOR"));
    return rutina ? NextResponse.json(rutina) : noEncontrado("Rutina no encontrada");
  } catch (error) {
    return errorInesperado(error);
  }
}
