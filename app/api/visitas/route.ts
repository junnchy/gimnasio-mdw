import { NextRequest, NextResponse } from "next/server";
import { listarVisitasDeSocio } from "@/lib/db/visitas";
import { duracionDeVisita } from "@/lib/visita";
import { limiteLista } from "@/lib/schemas/_common";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { parametrosInvalidos } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const socio = await requerirUsuario("SOCIO");
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());

    const visitas = await listarVisitasDeSocio(socio.id, resultado.data);
    // La duración se calcula al leer, no se guarda (ADR 0003).
    return NextResponse.json(visitas.map((visita) => ({ ...visita, duracionMin: duracionDeVisita(visita) })));
  } catch (error) {
    return responderError("GET /api/visitas", error);
  }
}
