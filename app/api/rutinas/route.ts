import { NextResponse } from "next/server";
import { crearRutina } from "@/lib/db/rutinas";
import { rutinaSchema } from "@/lib/schemas/rutina";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { datosInvalidos, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const profesor = await requerirUsuario("PROFESOR");
    // El socioId viene del body (a quién se le asigna); el profesorId, de la sesión.
    const resultado = rutinaSchema.omit({ profesorId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    const rutina = await crearRutina(resultado.data, profesor.id);
    return rutina ? NextResponse.json(rutina, { status: 201 }) : noEncontrado("Socio no encontrado");
  } catch (error) {
    return responderError("POST /api/rutinas", error);
  }
}
