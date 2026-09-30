import { NextResponse } from "next/server";
import { aplicarEstadoDeMercadoPago } from "@/lib/db/pagos";
import { notificacionMercadoPagoSchema } from "@/lib/schemas/mercadoPago";
import { obtenerPagoDeMercadoPago } from "@/lib/servicios/mercadoPago";
import { responderError } from "@/lib/errores";
import { datosInvalidos, servicioExternoCaido } from "@/lib/http";
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
 * - lo que nunca va a cambiar (otro tipo de evento, un pago que no es nuestro)
 *   → 200, para que no insista;
 * - lo que se arregla solo (Mercado Pago o la base caídos) → 502/500, para que
 *   reintente. Es el "se reintenta cuando el servicio vuelve" de la spec.
 */
export async function POST(request: Request) {
  try {
    const notificacion = notificacionMercadoPagoSchema.safeParse(await leerBody(request));
    if (!notificacion.success) return datosInvalidos(notificacion.error.flatten());

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
