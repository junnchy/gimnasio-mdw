import { NextResponse } from "next/server";
import { crearRutina } from "@/lib/db/rutinas";
import { rutinaSchema } from "@/lib/schemas/rutina";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { datosInvalidos, errorInesperado, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const resultado = rutinaSchema.omit({ profesorId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): profesorId y rol PROFESOR salen de sesión.
    const rutina = await crearRutina(resultado.data, await usuarioDeEjemplo("PROFESOR"));
    return rutina ? NextResponse.json(rutina, { status: 201 }) : noEncontrado("Socio no encontrado");
  } catch (error) {
    return errorInesperado(error);
  }
}
