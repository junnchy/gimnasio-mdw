import { NextResponse } from "next/server";
import { cerrarVisitasDelDia } from "@/lib/db/visitas";
import { responderError } from "@/lib/errores";

export async function POST(request: Request) {
  try {
    // Sin requerirUsuario A PROPÓSITO: lo llama un proceso programado, no una
    // persona. Se autentica con el secreto compartido `x-cron-secret`.
    const token = request.headers.get("x-cron-secret");
    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const resultado = await cerrarVisitasDelDia(new Date());
    return NextResponse.json({ visitasCerradas: resultado.count });
  } catch (error) {
    return responderError("POST /api/visitas/cierre-diario", error);
  }
}
