import { NextResponse } from "next/server";
import { obtenerMembresiaActual } from "@/lib/db/membresias";
import { estadoMembresiaVista } from "@/lib/membresia";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

export async function GET() {
  // TODO (clase 6): socioId sale de sesión.
  const membresia = await obtenerMembresiaActual(await usuarioDeEjemplo("SOCIO"));
  if (!membresia) return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 });
  return NextResponse.json({ ...membresia, estado: estadoMembresiaVista(membresia) });
}
