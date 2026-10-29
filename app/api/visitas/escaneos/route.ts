import { NextResponse } from "next/server";
import { registrarEscaneo } from "@/lib/casos/registrarEscaneo";
import { respuestaRechazo } from "@/lib/respuestaOperacion";
import { registrarEscaneoSchema } from "@/lib/schemas/escaneo";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { datosInvalidos } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const socio = await requerirUsuario("SOCIO");
    const resultado = registrarEscaneoSchema.omit({ socioId: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());
    const operacion = await registrarEscaneo(socio.id, resultado.data.qrToken);
    if (!operacion.ok) return respuestaRechazo(operacion);
    return NextResponse.json(operacion.dato, { status: operacion.dato.estado === "ABIERTA" ? 201 : 200 });
  } catch (error) {
    return responderError("POST /api/visitas/escaneos", error);
  }
}
