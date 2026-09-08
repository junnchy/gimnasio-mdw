import { NextRequest, NextResponse } from "next/server";
import { listarRutinasDeSocio } from "@/lib/db/rutinas";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { limiteLista } from "@/lib/schemas/_common";

export async function GET(request: NextRequest) {
  // TODO (clase 6): socioId sale de sesión.
  const resultado = limiteLista.safeParse(request.nextUrl.searchParams.get("limite") ?? undefined);
  if (!resultado.success) return NextResponse.json({ error: "Parámetros inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  return NextResponse.json(await listarRutinasDeSocio(await usuarioDeEjemplo("SOCIO"), resultado.data));
}
