import { NextResponse } from "next/server";
import { obtenerMembresiaActual } from "@/lib/db/membresias";
import { estadoMembresiaVista } from "@/lib/membresia";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { noEncontrado } from "@/lib/http";

export async function GET() {
  try {
    const socio = await requerirUsuario("SOCIO");
    const membresia = await obtenerMembresiaActual(socio.id);
    if (!membresia) return noEncontrado("Membresía no encontrada");
    // VENCIDA se calcula al leer (ADR 0002): la base guarda solo los hechos.
    return NextResponse.json({ ...membresia, estado: estadoMembresiaVista(membresia, new Date()) });
  } catch (error) {
    return responderError("GET /api/membresias/mia", error);
  }
}
