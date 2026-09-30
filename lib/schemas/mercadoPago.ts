import { z } from "zod";

/**
 * Respuesta de `POST /checkout/preferences` de Mercado Pago. Es entrada
 * externa: se valida antes de usarla. Solo se declaran los campos que usamos;
 * el resto de la respuesta se descarta.
 */
export const preferenciaMercadoPagoSchema = z.object({
  id: z.string().min(1).max(200),
  init_point: z.string().url().max(2000),
});
export type PreferenciaMercadoPago = z.infer<typeof preferenciaMercadoPagoSchema>;

/**
 * Id de un pago de Mercado Pago. Llega como número o como string según el
 * canal, así que se normaliza a string. Solo dígitos: va pegado a la URL de la
 * API (`/v1/payments/<id>`), y un `../` o un `?` cambiaría a qué endpoint le
 * pegamos con nuestro token.
 */
const idPagoMercadoPago = z
  .union([z.string(), z.number().int().positive()])
  .transform(String)
  .pipe(z.string().regex(/^\d{1,20}$/, "id de pago inválido"));

/**
 * Body de la notificación (webhook) que manda Mercado Pago. Solo trae QUÉ
 * cambió, nunca el estado: el estado se consulta a la API con nuestro token.
 */
export const notificacionMercadoPagoSchema = z.object({
  type: z.string().min(1).max(50),
  data: z.object({ id: idPagoMercadoPago }),
});
export type NotificacionMercadoPago = z.infer<typeof notificacionMercadoPagoSchema>;

export const estadoMercadoPago = z.enum([
  "pending",
  "approved",
  "authorized",
  "in_process",
  "in_mediation",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
]);
export type EstadoMercadoPago = z.infer<typeof estadoMercadoPago>;

/** Respuesta de `GET /v1/payments/:id`. `external_reference` es el id de nuestro Pago. */
export const pagoMercadoPagoSchema = z.object({
  id: idPagoMercadoPago,
  status: estadoMercadoPago,
  external_reference: z.string().max(200).nullable(),
});
export type PagoMercadoPago = z.infer<typeof pagoMercadoPagoSchema>;
