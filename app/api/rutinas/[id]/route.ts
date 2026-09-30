import { NextResponse } from "next/server";
import { actualizarRutina } from "@/lib/db/rutinas";
import { id } from "@/lib/schemas/_common";
import { rutinaSchema } from "@/lib/schemas/rutina";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { datosInvalidos, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Contexto) {
  try {
    const profesor = await requerirUsuario("PROFESOR");
    const { id: rutinaId } = await params;
    if (!id.safeParse(rutinaId).success) return noEncontrado("Rutina no encontrada");
    const resultado = rutinaSchema.omit({ profesorId: true, socioId: true }).partial().safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // `actualizarRutina` filtra por profesorId en el WHERE: la rutina de otro
    // profesor da null → 404.
    const rutina = await actualizarRutina(rutinaId, resultado.data, profesor.id);
    return rutina ? NextResponse.json(rutina) : noEncontrado("Rutina no encontrada");
  } catch (error) {
    return responderError("PATCH /api/rutinas/:id", error);
  }
}
