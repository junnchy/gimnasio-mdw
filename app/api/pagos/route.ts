import { NextResponse } from "next/server";
import { crearPago } from "@/lib/db/pagos";
import { pagoSchema } from "@/lib/schemas/pago";

export async function POST(request: Request) {
  const resultado = pagoSchema.safeParse(await request.json() as unknown);
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 5): con pago APROBADO, renovar membresía en la misma transacción.
  // TODO (clase 6): exigir ADMIN.
  const pago = await crearPago(resultado.data);
  return pago ? NextResponse.json(pago, { status: 201 }) : NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 });
}
