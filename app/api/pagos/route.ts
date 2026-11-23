import { NextResponse } from "next/server";
import { MENSAJE_MP_NO_DISPONIBLE, registrarPago } from "@/lib/casos/registrarPago";
import { pagoSchema } from "@/lib/schemas/pago";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflicto, datosInvalidos, noEncontrado, servicioExternoCaido } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await requerirUsuario("ADMIN");

    // Ni el `estado` ni la `refExterna` se aceptan del cliente: el estado lo
    // decide el servidor según el medio (spec §8) y la referencia la escribe
    // el webhook con lo que informa Mercado Pago.
    const resultado = pagoSchema.omit({ estado: true, refExterna: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());

    // Las reglas (EFECTIVO vs MP, membresía cancelada, Mercado Pago caído)
    // viven en el caso de uso, compartido con la pantalla /socios/:id.
    const registro = await registrarPago(resultado.data, new Date());
    if (!registro.ok) {
      if (registro.tipo === "NO_ENCONTRADO") return noEncontrado("Membresía no encontrada");
      if (registro.tipo === "CONFLICTO") return conflicto(registro.veredicto);
      return servicioExternoCaido(MENSAJE_MP_NO_DISPONIBLE);
    }

    const { pago, renovada, fechaFin, checkoutUrl } = registro.dato;
    return NextResponse.json({ pago, membresia: { renovada, fechaFin }, checkoutUrl }, { status: 201 });
  } catch (error) {
    return responderError("POST /api/pagos", error);
  }
}
