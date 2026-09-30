/**
 * Mercado Pago (spec §8) — el único lugar del sistema que habla con afuera
 * para cobrar. Ningún otro archivo hace `fetch` a Mercado Pago ni lee su
 * credencial.
 *
 * Reglas de este módulo:
 * 1. Timeout: toda llamada corta a los 5 s. Si Mercado Pago está lento, no
 *    nos cuelga el request del admin.
 * 2. Devuelve en vez de lanzar: si algo falla, `crearPreferenciaDePago`
 *    devuelve `null`. Quien llama decide qué hacer; nunca le explota.
 * 3. La credencial vive solo acá: `MP_ACCESS_TOKEN` se lee en este archivo y
 *    en ningún otro. Nunca lleva prefijo `NEXT_PUBLIC_` (quedaría visible en
 *    el navegador).
 * 4. La falla se loguea: todo `null` va acompañado de un `console.error` con
 *    el motivo, para poder reintentar el cobro cuando el servicio vuelva.
 */
import {
  pagoMercadoPagoSchema,
  preferenciaMercadoPagoSchema,
  type PagoMercadoPago,
  type PreferenciaMercadoPago,
} from "@/lib/schemas/mercadoPago";

const API_URL = "https://api.mercadopago.com";
const TIMEOUT_MS = 5000;

/**
 * Arma el cliente leyendo las variables de entorno **recién al llamarse**, no
 * al importar el módulo: así un token faltante no rompe el build ni los
 * endpoints que no cobran, y los tests pueden setear el entorno antes de usarlo.
 */
function obtenerCliente() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return null;

  async function pedir(ruta: string, init: { method: "GET" | "POST"; body?: string }): Promise<unknown> {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!respuesta.ok) {
      throw new Error(`Mercado Pago respondió ${respuesta.status}: ${await respuesta.text()}`);
    }
    return respuesta.json();
  }

  return {
    get: (ruta: string) => pedir(ruta, { method: "GET" }),
    post: (ruta: string, body: unknown) => pedir(ruta, { method: "POST", body: JSON.stringify(body) }),
  };
}

/**
 * Crea la preferencia de Checkout Pro para un pago ya registrado. El
 * `external_reference` es el id de nuestro Pago: es lo que el webhook va a
 * usar para encontrarlo y aprobarlo.
 *
 * Nunca lanza: si falla, loguea y devuelve `null`.
 */
export async function crearPreferenciaDePago(pago: {
  id: string;
  monto: number;
}): Promise<PreferenciaMercadoPago | null> {
  try {
    const cliente = obtenerCliente();
    if (!cliente) {
      console.error("[mercadoPago] Falta MP_ACCESS_TOKEN: no se creó la preferencia del pago", pago.id);
      return null;
    }

    const respuesta = await cliente.post("/checkout/preferences", {
      items: [{ title: "Cuota de membresía", quantity: 1, unit_price: pago.monto, currency_id: "ARS" }],
      external_reference: pago.id,
    });

    const resultado = preferenciaMercadoPagoSchema.safeParse(respuesta);
    if (!resultado.success) {
      console.error("[mercadoPago] Respuesta inesperada al crear la preferencia del pago", pago.id, resultado.error.flatten());
      return null;
    }
    return resultado.data;
  } catch (error) {
    console.error("[mercadoPago] No se pudo crear la preferencia del pago", pago.id, error);
    return null;
  }
}

/**
 * Consulta el estado REAL de un pago en Mercado Pago. El webhook no confía en
 * lo que dice la notificación: con el id que trae, le pregunta a la API con
 * nuestro token. Así nadie puede aprobar un pago mandándonos un POST.
 *
 * `idPagoMercadoPago` tiene que llegar validado (solo dígitos, ver
 * `notificacionMercadoPagoSchema`): va pegado a la URL.
 *
 * Nunca lanza: si falla, loguea y devuelve `null`.
 */
export async function obtenerPagoDeMercadoPago(idPagoMercadoPago: string): Promise<PagoMercadoPago | null> {
  try {
    const cliente = obtenerCliente();
    if (!cliente) {
      console.error("[mercadoPago] Falta MP_ACCESS_TOKEN: no se pudo consultar el pago", idPagoMercadoPago);
      return null;
    }

    const respuesta = await cliente.get(`/v1/payments/${idPagoMercadoPago}`);

    const resultado = pagoMercadoPagoSchema.safeParse(respuesta);
    if (!resultado.success) {
      console.error("[mercadoPago] Respuesta inesperada al consultar el pago", idPagoMercadoPago, resultado.error.flatten());
      return null;
    }
    return resultado.data;
  } catch (error) {
    console.error("[mercadoPago] No se pudo consultar el pago", idPagoMercadoPago, error);
    return null;
  }
}
