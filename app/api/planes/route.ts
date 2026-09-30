import { NextRequest, NextResponse } from "next/server";
import { crearPlan, listarPlanes } from "@/lib/db/planes";
import { esDuplicado } from "@/lib/db/errores";
import { listarPlanesSchema, planSchema } from "@/lib/schemas/plan";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflictoSimple, datosInvalidos, parametrosInvalidos } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await requerirUsuario("ADMIN");
    const resultado = listarPlanesSchema.safeParse({
      limite: request.nextUrl.searchParams.get("limite") ?? undefined,
    });
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarPlanes(resultado.data.limite));
  } catch (error) {
    return responderError("GET /api/planes", error);
  }
}

export async function POST(request: Request) {
  try {
    await requerirUsuario("ADMIN");
    const resultado = planSchema.safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    return NextResponse.json(await crearPlan(resultado.data), { status: 201 });
  } catch (error) {
    if (esDuplicado(error)) return conflictoSimple("Ya existe un plan con ese nombre", "PLAN_DUPLICADO");
    return responderError("POST /api/planes", error);
  }
}
