import { NextResponse } from "next/server";
import { actualizarPlan } from "@/lib/db/planes";
import { id } from "@/lib/schemas/_common";
import { planSchema } from "@/lib/schemas/plan";
import { leerBody } from "@/lib/utils";

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Contexto) {
  const { id: planId } = await params;
  if (!id.safeParse(planId).success) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const resultado = planSchema.partial().safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): exigir sesión ADMIN.
  const plan = await actualizarPlan(planId, resultado.data);
  return plan ? NextResponse.json(plan) : NextResponse.json({ error: "No encontrado" }, { status: 404 });
}
