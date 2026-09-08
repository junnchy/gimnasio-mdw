import { NextResponse } from "next/server";
import { cerrarVisitasDelDia } from "@/lib/db/visitas";

export async function POST(request: Request) {
  const token = request.headers.get("x-cron-secret");
  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const resultado = await cerrarVisitasDelDia();
  return NextResponse.json({ visitasCerradas: resultado.count });
}
