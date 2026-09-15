import { NextRequest, NextResponse } from "next/server";
import { crearEjercicio, listarEjercicios } from "@/lib/db/ejercicios";
import { esDuplicado } from "@/lib/db/errores";
import { ejercicioSchema } from "@/lib/schemas/ejercicio";
import { limiteLista } from "@/lib/schemas/_common";
import { conflictoSimple, datosInvalidos, errorInesperado, parametrosInvalidos } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // TODO (clase 6): exigir sesión de PROFESOR.
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarEjercicios(resultado.data));
  } catch (error) {
    return errorInesperado(error);
  }
}

export async function POST(request: Request) {
  try {
    const resultado = ejercicioSchema.safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): exigir sesión de PROFESOR.
    return NextResponse.json(await crearEjercicio(resultado.data), { status: 201 });
  } catch (error) {
    if (esDuplicado(error)) {
      return conflictoSimple("Ya existe un ejercicio con ese nombre", "EJERCICIO_DUPLICADO");
    }
    return errorInesperado(error);
  }
}
