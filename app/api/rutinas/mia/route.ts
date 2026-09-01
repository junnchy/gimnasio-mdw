import { NextResponse } from "next/server";
import { listarRutinasDeSocio } from "@/lib/db/rutinas";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

export async function GET() {
  // TODO (clase 6): socioId sale de sesión.
  return NextResponse.json(await listarRutinasDeSocio(await usuarioDeEjemplo("SOCIO")));
}
