import { NextResponse } from "next/server";
import { aplicarEstadoDeMercadoPago } from "@/lib/db/pagos";
import { notificacionMercadoPagoSchema } from "@/lib/schemas/mercadoPago";
import { obtenerPagoDeMercadoPago } from "@/lib/servicios/mercadoPago";
import { responderError } from "@/lib/errores";
import { servicioExternoCaido } from "@/lib/http";
import { leerBody } from "@/lib/utils";

/**
 * Webhook de Mercado Pago (spec §8). Lo llama Mercado Pago, no un usuario:
 * no hay sesión que pedir con `requerirUsuario`.
 *
 * La seguridad sale de NO creerle a la notificación. El body solo aporta un
 * id; el estado se consulta a la API de Mercado Pago con nuestro token, y
 * nuestro Pago se busca por el `external_reference` que devuelve esa consulta,
 * no por nada que venga en el request. Un POST falso, como mucho, nos hace
 * consultar un pago que no existe o uno que ya está aplicado.
 *
 * Cómo lee Mercado Pago la respuesta: cualquier 2xx es "recibido, no
 * reintentes"; cualquier otra cosa, "reintentá más tarde". Por eso:
 * - lo que nunca va a cambiar (un body con otro formato, otro tipo de evento,
 *   un pago que no es nuestro) → 200, para que no insista. Un 400 haría que
 *   Mercado Pago reenvíe para siempre algo que nunca vamos a aceptar;
 * - lo que puede andar en otro intento (Mercado Pago o la base caídos) →
 *   502/500. Ese reenvío lo hace Mercado Pago, no nuestro sistema.
 */
export async function POST(request: Request) {
  try {
    const notificacion = notificacionMercadoPagoSchema.safeParse(await leerBody(request));
    if (!notificacion.success) {
      console.error("POST /api/pagos/webhook: notificación con formato inesperado", notificacion.error.flatten());
      return NextResponse.json({ resultado: "IGNORADA" });
    }

    if (notificacion.data.type !== "payment") {
      return NextResponse.json({ resultado: "IGNORADA" });
    }

    const pagoMercadoPago = await obtenerPagoDeMercadoPago(notificacion.data.data.id);
    if (!pagoMercadoPago) return servicioExternoCaido("No se pudo consultar el pago en Mercado Pago");

    if (!pagoMercadoPago.external_reference) {
      console.error("POST /api/pagos/webhook: pago de Mercado Pago sin external_reference", pagoMercadoPago.id);
      return NextResponse.json({ resultado: "IGNORADA" });
    }

    const resultado = await aplicarEstadoDeMercadoPago(
      pagoMercadoPago.external_reference,
      { idPagoMercadoPago: pagoMercadoPago.id, estadoMercadoPago: pagoMercadoPago.status },
      new Date(),
    );
    if (resultado.resultado === "NO_ENCONTRADO") {
      console.error("POST /api/pagos/webhook: no existe el Pago", pagoMercadoPago.external_reference);
    }

    return NextResponse.json(resultado);
  } catch (error) {
    return responderError("POST /api/pagos/webhook", error);
  }
}
