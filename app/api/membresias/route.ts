import { NextResponse } from "next/server";
import { crearMembresia } from "@/lib/db/membresias";
import { crearMembresiaSchema } from "@/lib/schemas/membresia";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  const resultado = crearMembresiaSchema.safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): exigir ADMIN.
  const membresia = await crearMembresia(resultado.data);
  return membresia ? NextResponse.json(membresia, { status: 201 }) : NextResponse.json({ error: "Socio o plan no encontrado" }, { status: 404 });
}
