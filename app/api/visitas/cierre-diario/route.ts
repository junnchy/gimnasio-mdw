import { NextResponse } from "next/server";
import { cerrarVisitasDelDia } from "@/lib/db/visitas";
import { errorInesperado } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-cron-secret");
    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const resultado = await cerrarVisitasDelDia(new Date());
    return NextResponse.json({ visitasCerradas: resultado.count });
  } catch (error) {
    return errorInesperado(error);
  }
}
