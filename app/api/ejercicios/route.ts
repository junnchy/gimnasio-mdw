import { NextRequest, NextResponse } from "next/server";
import { crearEjercicio, listarEjercicios } from "@/lib/db/ejercicios";
import { ejercicioSchema } from "@/lib/schemas/ejercicio";
import { leerBody } from "@/lib/utils";
import { limiteLista } from "@/lib/schemas/_common";
import { esDuplicado } from "@/lib/db/errores";

export async function GET(request: NextRequest) {
  // TODO (clase 6): exigir sesión de PROFESOR.
  const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
  if (!resultado.success) return NextResponse.json({ error: "Parámetros inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  return NextResponse.json(await listarEjercicios(resultado.data));
}

export async function POST(request: Request) {
  const resultado = ejercicioSchema.safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): exigir sesión de PROFESOR.
  try {
    return NextResponse.json(await crearEjercicio(resultado.data), { status: 201 });
  } catch (error) {
    if (esDuplicado(error)) return NextResponse.json({ error: "Ya existe un ejercicio con ese nombre" }, { status: 409 });
    throw error;
  }
}
