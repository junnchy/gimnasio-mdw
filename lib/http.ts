/**
 * Traducción de resultados de negocio a respuestas HTTP.
 *
 * Criterio de la clase 5 para elegir el código:
 * - 400: el cliente lo arregla mandando otros datos (estructura o tipos).
 * - 404: el recurso no existe (o no es visible para quien pregunta).
 * - 409: los datos están bien, pero el estado del sistema no permite la operación.
 * - 500: falla inesperada del sistema. Nunca lleva detalle al cliente.
 */
import { NextResponse } from "next/server";
import type { Veredicto } from "@/lib/reglas";

export function datosInvalidos(detalles: unknown) {
  return NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 });
}

export function parametrosInvalidos(detalles: unknown) {
  return NextResponse.json({ error: "Parámetros inválidos", detalles }, { status: 400 });
}

export function noEncontrado(mensaje: string) {
  return NextResponse.json({ error: mensaje }, { status: 404 });
}

export function prohibido(mensaje: string) {
  return NextResponse.json({ error: mensaje }, { status: 403 });
}

/**
 * 409 a partir de un veredicto: el primer motivo va como `error` (lo que se
 * muestra) y la lista completa como `motivos` (lo que el front procesa).
 */
export function conflicto(resultado: Veredicto) {
  return NextResponse.json(
    { error: resultado.motivos[0]?.mensaje ?? "La operación no se puede realizar", motivos: resultado.motivos },
    { status: 409 },
  );
}

export function conflictoSimple(mensaje: string, codigo: string) {
  return NextResponse.json(
    { error: mensaje, motivos: [{ codigo, mensaje }] },
    { status: 409 },
  );
}

/**
 * Único lugar donde se responde 500. El detalle va al log del servidor, no al
 * cliente: un error inesperado no se le explica a quien llama.
 */
export function errorInesperado(error: unknown) {
  console.error(error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
