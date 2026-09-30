import { NextResponse } from "next/server";
import { crearMembresia } from "@/lib/db/membresias";
import { crearMembresiaSchema } from "@/lib/schemas/membresia";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { datosInvalidos, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await requerirUsuario("ADMIN");
    const resultado = crearMembresiaSchema.safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    const membresia = await crearMembresia(resultado.data);
    return membresia
      ? NextResponse.json(membresia, { status: 201 })
      : noEncontrado("Socio o plan no encontrado");
  } catch (error) {
    return responderError("POST /api/membresias", error);
  }
}
