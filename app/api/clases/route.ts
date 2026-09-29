import { NextRequest, NextResponse } from "next/server";
import { crearClase, listarClases } from "@/lib/db/clases";
import { claseSchema } from "@/lib/schemas/clase";
import { limiteLista } from "@/lib/schemas/_common";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { datosInvalidos, parametrosInvalidos } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // Cualquier rol con sesión: el socio la ve para reservar, el profesor y
    // el admin para organizar. Sin sesión, 401.
    await requerirUsuario();
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarClases(resultado.data));
  } catch (error) {
    return responderError("GET /api/clases", error);
  }
}

export async function POST(request: Request) {
  try {
    const profesor = await requerirUsuario("PROFESOR");
    const resultado = claseSchema.omit({ profesorId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // El profesorId sale de la sesión, nunca del body.
    const clase = await crearClase(resultado.data, profesor.id);
    return NextResponse.json(clase, { status: 201 });
  } catch (error) {
    return responderError("POST /api/clases", error);
  }
}
