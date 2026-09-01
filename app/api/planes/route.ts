import { NextRequest, NextResponse } from "next/server";
import { crearPlan, listarPlanes } from "@/lib/db/planes";
import { listarPlanesSchema, planSchema } from "@/lib/schemas/plan";

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
  const body: unknown = await request.json();
  const resultado = planSchema.safeParse(body);

  if (!resultado.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: resultado.error.flatten() },
      { status: 400 },
    );
  }

  // TODO (clase 6): exigir sesión con rol ADMIN.
  return NextResponse.json(await crearPlan(resultado.data), { status: 201 });
}
