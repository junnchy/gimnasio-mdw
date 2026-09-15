import { NextResponse } from "next/server";
import { crearMembresia } from "@/lib/db/membresias";
import { crearMembresiaSchema } from "@/lib/schemas/membresia";
import { datosInvalidos, errorInesperado, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const resultado = crearMembresiaSchema.safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // TODO (clase 6): exigir ADMIN.
    const membresia = await crearMembresia(resultado.data);
    return membresia
      ? NextResponse.json(membresia, { status: 201 })
      : noEncontrado("Socio o plan no encontrado");
  } catch (error) {
    return errorInesperado(error);
  }
}
