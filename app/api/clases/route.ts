import { NextRequest, NextResponse } from "next/server";
import { crearClase, listarClases } from "@/lib/db/clases";
import { claseSchema } from "@/lib/schemas/clase";
import { limiteLista } from "@/lib/schemas/_common";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { datosInvalidos, errorInesperado, parametrosInvalidos } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarClases(resultado.data));
  } catch (error) {
    return errorInesperado(error);
  }
}

export async function POST(request: Request) {
  try {
    const resultado = claseSchema.omit({ profesorId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): profesorId sale de la sesión y se verifica rol PROFESOR.
    const clase = await crearClase(resultado.data, await usuarioDeEjemplo("PROFESOR"));
    return NextResponse.json(clase, { status: 201 });
  } catch (error) {
    return errorInesperado(error);
  }
}
