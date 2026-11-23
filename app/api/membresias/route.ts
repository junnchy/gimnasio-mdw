import { NextResponse } from "next/server";
import { asignarMembresia } from "@/lib/casos/asignarMembresia";
import { crearMembresiaSchema } from "@/lib/schemas/membresia";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflicto, datosInvalidos, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await requerirUsuario("ADMIN");
    const resultado = crearMembresiaSchema.safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    // Mismo caso de uso que /socios/:id: un socio con una membresía ACTIVA
    // no recibe otra (índice único) y el que pierde la carrera recibe 409.
    const alta = await asignarMembresia(resultado.data);
    if (!alta.ok) return alta.tipo === "NO_ENCONTRADO" ? noEncontrado("Socio o plan no encontrado") : conflicto(alta);
    return NextResponse.json(alta.dato, { status: 201 });
  } catch (error) {
    return responderError("POST /api/membresias", error);
  }
}
