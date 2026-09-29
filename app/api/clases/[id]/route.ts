import { NextResponse } from "next/server";
import { actualizarClase, obtenerClase } from "@/lib/db/clases";
import { id } from "@/lib/schemas/_common";
import { claseSchema } from "@/lib/schemas/clase";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { datosInvalidos, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  try {
    // Mismo criterio que el listado: cualquier rol con sesión.
    await requerirUsuario();
    const { id: claseId } = await params;
    if (!id.safeParse(claseId).success) return noEncontrado("Clase no encontrada");
    const clase = await obtenerClase(claseId);
    return clase ? NextResponse.json(clase) : noEncontrado("Clase no encontrada");
  } catch (error) {
    return responderError("GET /api/clases/:id", error);
  }
}

export async function PATCH(request: Request, { params }: Contexto) {
  try {
    const profesor = await requerirUsuario("PROFESOR");
    const { id: claseId } = await params;
    if (!id.safeParse(claseId).success) return noEncontrado("Clase no encontrada");
    const resultado = claseSchema.omit({ profesorId: true }).partial().safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // `actualizarClase` filtra por profesorId en el WHERE: la clase de otro
    // profesor da null → 404, igual que una que no existe.
    const clase = await actualizarClase(claseId, resultado.data, profesor.id);
    return clase ? NextResponse.json(clase) : noEncontrado("Clase no encontrada");
  } catch (error) {
    return responderError("PATCH /api/clases/:id", error);
  }
}
