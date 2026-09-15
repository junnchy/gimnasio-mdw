import { NextRequest, NextResponse } from "next/server";
import { listarRutinasDeSocio } from "@/lib/db/rutinas";
import { limiteLista } from "@/lib/schemas/_common";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { errorInesperado, parametrosInvalidos } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    // TODO (clase 6): socioId sale de sesión.
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarRutinasDeSocio(await usuarioDeEjemplo("SOCIO"), resultado.data));
  } catch (error) {
    return errorInesperado(error);
  }
}
