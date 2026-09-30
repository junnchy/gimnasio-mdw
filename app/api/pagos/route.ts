import { NextResponse } from "next/server";
import { obtenerMembresiaParaPago } from "@/lib/db/membresias";
import { registrarPago } from "@/lib/db/pagos";
import { puedeRegistrarPago } from "@/lib/pago";
import { crearPreferenciaDePago } from "@/lib/servicios/mercadoPago";
import { pagoSchema } from "@/lib/schemas/pago";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflicto, datosInvalidos, noEncontrado } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await requerirUsuario("ADMIN");

    // El `estado` del pago no se acepta del cliente: lo decide el servidor
    // según el medio (spec §8).
    const resultado = pagoSchema.omit({ estado: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());

    const membresia = await obtenerMembresiaParaPago(resultado.data.membresiaId);
    if (!membresia) return noEncontrado("Membresía no encontrada");

    const veredicto = puedeRegistrarPago({ estadoMembresia: membresia.estado });
    if (!veredicto.ok) return conflicto(veredicto);

    const { pago, renovada, fechaFin } = await registrarPago(resultado.data, membresia, new Date());

    // A PARTIR DE ACÁ EL PAGO YA ESTÁ REGISTRADO. Nada de lo que sigue puede
    // deshacerlo ni convertir la respuesta en error.
    //
    // Solo un pago MP necesita preferencia (el EFECTIVO ya nació APROBADO).
    // Si Mercado Pago falla, `checkoutUrl` va null y el pago queda PENDIENTE:
    // el cobro online se reintenta cuando el servicio vuelve, y mientras tanto
    // el admin puede registrar el pago en EFECTIVO (spec §8).
    let checkoutUrl: string | null = null;
    if (resultado.data.medio === "MP") {
      const preferencia = await crearPreferenciaDePago({ id: pago.id, monto: resultado.data.monto });
      checkoutUrl = preferencia?.init_point ?? null;
    }

    return NextResponse.json({ pago, membresia: { renovada, fechaFin }, checkoutUrl }, { status: 201 });
  } catch (error) {
    return responderError("POST /api/pagos", error);
  }
}
