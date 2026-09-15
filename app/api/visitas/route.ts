import { NextRequest, NextResponse } from "next/server";
import { listarVisitasDeSocio } from "@/lib/db/visitas";
import { duracionDeVisita } from "@/lib/visita";
import { limiteLista } from "@/lib/schemas/_common";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { errorInesperado, parametrosInvalidos } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    // TODO (clase 6): socioId sale de sesión.
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());

    const visitas = await listarVisitasDeSocio(await usuarioDeEjemplo("SOCIO"), resultado.data);
    // La duración se calcula al leer, no se guarda (ADR 0003).
    return NextResponse.json(visitas.map((visita) => ({ ...visita, duracionMin: duracionDeVisita(visita) })));
  } catch (error) {
    return errorInesperado(error);
  }
}
