import { NextRequest, NextResponse } from "next/server";
import { listarRutinasDeSocio } from "@/lib/db/rutinas";
import { limiteLista } from "@/lib/schemas/_common";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { parametrosInvalidos } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const socio = await requerirUsuario("SOCIO");
    const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
    if (!resultado.success) return parametrosInvalidos(resultado.error.flatten());
    return NextResponse.json(await listarRutinasDeSocio(socio.id, resultado.data));
  } catch (error) {
    return responderError("GET /api/rutinas/mia", error);
  }
}
