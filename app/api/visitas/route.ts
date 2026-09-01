import { NextResponse } from "next/server";
import { listarVisitasDeSocio } from "@/lib/db/visitas";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

export async function GET() {
  // TODO (clase 6): socioId sale de sesión.
  return NextResponse.json(await listarVisitasDeSocio(await usuarioDeEjemplo("SOCIO")));
}
