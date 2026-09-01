import { NextResponse } from "next/server";
import { cerrarVisitasDelDia } from "@/lib/db/visitas";

export async function POST() {
  // TODO (clase 6): exigir ADMIN o proceso programado autenticado.
  const resultado = await cerrarVisitasDelDia();
  return NextResponse.json({ visitasCerradas: resultado.count });
}
