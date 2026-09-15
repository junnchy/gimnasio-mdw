import { NextRequest, NextResponse } from "next/server";
import { crearPlan, listarPlanes } from "@/lib/db/planes";
import { esDuplicado } from "@/lib/db/errores";
import { listarPlanesSchema, planSchema } from "@/lib/schemas/plan";
import { conflictoSimple, datosInvalidos, errorInesperado, parametrosInvalidos } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const resultado = listarPlanesSchema.safeParse({
      limite: request.nextUrl.searchParams.get("limite") ?? undefined,
    });
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarPlanes(resultado.data.limite));
  } catch (error) {
    return errorInesperado(error);
  }
}

export async function POST(request: Request) {
  try {
    const resultado = planSchema.safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): exigir sesión con rol ADMIN.
    return NextResponse.json(await crearPlan(resultado.data), { status: 201 });
  } catch (error) {
    if (esDuplicado(error)) return conflictoSimple("Ya existe un plan con ese nombre", "PLAN_DUPLICADO");
    return errorInesperado(error);
  }
}
