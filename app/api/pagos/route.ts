import { NextResponse } from "next/server";
import { obtenerMembresiaParaPago } from "@/lib/db/membresias";
import { registrarPago } from "@/lib/db/pagos";
import { puedeRegistrarPago } from "@/lib/pago";
import { pagoSchema } from "@/lib/schemas/pago";
import { conflicto, datosInvalidos, errorInesperado, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    // El `estado` del pago no se acepta del cliente: lo decide el servidor
    // según el medio (spec §8).
    const resultado = pagoSchema.omit({ estado: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());

    // TODO (clase 6): exigir ADMIN.
    const membresia = await obtenerMembresiaParaPago(resultado.data.membresiaId);
    if (!membresia) return noEncontrado("Membresía no encontrada");

    const veredicto = puedeRegistrarPago({ estadoMembresia: membresia.estado });
    if (!veredicto.ok) return conflicto(veredicto);

    const { pago, renovada, fechaFin } = await registrarPago(resultado.data, membresia, new Date());
    return NextResponse.json({ pago, membresia: { renovada, fechaFin } }, { status: 201 });
  } catch (error) {
    return errorInesperado(error);
  }
}
