import { NextResponse } from "next/server";
import { actualizarClase, obtenerClase } from "@/lib/db/clases";
import { id } from "@/lib/schemas/_common";
import { claseSchema } from "@/lib/schemas/clase";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { datosInvalidos, errorInesperado, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  try {
    const { id: claseId } = await params;
    if (!id.safeParse(claseId).success) return noEncontrado("Clase no encontrada");
    const clase = await obtenerClase(claseId);
    return clase ? NextResponse.json(clase) : noEncontrado("Clase no encontrada");
  } catch (error) {
    return errorInesperado(error);
  }
}

export async function PATCH(request: Request, { params }: Contexto) {
  try {
    const { id: claseId } = await params;
    if (!id.safeParse(claseId).success) return noEncontrado("Clase no encontrada");
    const resultado = claseSchema.omit({ profesorId: true }).partial().safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): verificar profesor de sesión.
    const clase = await actualizarClase(claseId, resultado.data, await usuarioDeEjemplo("PROFESOR"));
    return clase ? NextResponse.json(clase) : noEncontrado("Clase no encontrada");
  } catch (error) {
    return errorInesperado(error);
  }
}
