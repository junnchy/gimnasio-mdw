import { NextResponse } from "next/server";
import { registrarEscaneo } from "@/lib/db/visitas";
import { registrarEscaneoSchema } from "@/lib/schemas/escaneo";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  const resultado = registrarEscaneoSchema.omit({ socioId: true }).safeParse(await leerBody(request));
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 5): validar token QR, membresía activa y debounce de 60 segundos.
  // TODO (clase 6): socioId sale de sesión.
  return NextResponse.json(await registrarEscaneo(await usuarioDeEjemplo("SOCIO")), { status: 201 });
}
