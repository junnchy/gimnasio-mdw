import { NextResponse } from "next/server";
import { actualizarPlan } from "@/lib/db/planes";
import { esDuplicado } from "@/lib/db/errores";
import { id } from "@/lib/schemas/_common";
import { planSchema } from "@/lib/schemas/plan";
import { conflictoSimple, datosInvalidos, errorInesperado, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Contexto) {
  try {
    const { id: planId } = await params;
    if (!id.safeParse(planId).success) return noEncontrado("No encontrado");
    const resultado = planSchema.partial().safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): exigir sesión ADMIN.
    const plan = await actualizarPlan(planId, resultado.data);
    return plan ? NextResponse.json(plan) : noEncontrado("No encontrado");
  } catch (error) {
    if (esDuplicado(error)) return conflictoSimple("Ya existe un plan con ese nombre", "PLAN_DUPLICADO");
    return errorInesperado(error);
  }
}
