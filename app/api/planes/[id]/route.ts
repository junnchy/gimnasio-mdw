import { NextResponse } from "next/server";
import { actualizarPlan } from "@/lib/db/planes";
import { esDuplicado } from "@/lib/db/errores";
import { id } from "@/lib/schemas/_common";
import { planSchema } from "@/lib/schemas/plan";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflictoSimple, datosInvalidos, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Contexto) {
  try {
    await requerirUsuario("ADMIN");
    const { id: planId } = await params;
    if (!id.safeParse(planId).success) return noEncontrado("No encontrado");
    const resultado = planSchema.partial().safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    const plan = await actualizarPlan(planId, resultado.data);
    return plan ? NextResponse.json(plan) : noEncontrado("No encontrado");
  } catch (error) {
    if (esDuplicado(error)) return conflictoSimple("Ya existe un plan con ese nombre", "PLAN_DUPLICADO");
    return responderError("PATCH /api/planes/:id", error);
  }
}
