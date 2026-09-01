import { NextResponse } from "next/server";
import { crearEjercicio, listarEjercicios } from "@/lib/db/ejercicios";
import { ejercicioSchema } from "@/lib/schemas/ejercicio";

export async function GET() {
  // TODO (clase 6): exigir sesión de PROFESOR.
  return NextResponse.json(await listarEjercicios());
}

export async function POST(request: Request) {
  const resultado = ejercicioSchema.safeParse(await request.json() as unknown);
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): exigir sesión de PROFESOR.
  return NextResponse.json(await crearEjercicio(resultado.data), { status: 201 });
}
