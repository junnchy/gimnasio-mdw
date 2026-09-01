import { NextResponse } from "next/server";
import { crearMembresia } from "@/lib/db/membresias";
import { membresiaSchema } from "@/lib/schemas/membresia";

export async function POST(request: Request) {
  const resultado = membresiaSchema.safeParse(await request.json() as unknown);
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): exigir ADMIN.
  const membresia = await crearMembresia(resultado.data);
  return membresia ? NextResponse.json(membresia, { status: 201 }) : NextResponse.json({ error: "Socio o plan no encontrado" }, { status: 404 });
}
