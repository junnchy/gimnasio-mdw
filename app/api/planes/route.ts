import { NextRequest, NextResponse } from "next/server";
import { crearPlan, listarPlanes } from "@/lib/db/planes";
import { esDuplicado } from "@/lib/db/errores";
import { listarPlanesSchema, planSchema } from "@/lib/schemas/plan";
import { leerBody } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const resultado = listarPlanesSchema.safeParse({
    limite: request.nextUrl.searchParams.get("limite") ?? undefined,
  });

  if (!resultado.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", detalles: resultado.error.flatten() },
      { status: 400 },
    );
  }

  return NextResponse.json(await listarPlanes(resultado.data.limite));
}

export async function POST(request: Request) {
  const resultado = planSchema.safeParse(await leerBody(request));

  if (!resultado.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: resultado.error.flatten() },
      { status: 400 },
    );
  }

  // TODO (clase 6): exigir sesión con rol ADMIN.
  try {
    return NextResponse.json(await crearPlan(resultado.data), { status: 201 });
  } catch (error) {
    if (esDuplicado(error)) return NextResponse.json({ error: "Ya existe un plan con ese nombre" }, { status: 409 });
    throw error;
  }
}
