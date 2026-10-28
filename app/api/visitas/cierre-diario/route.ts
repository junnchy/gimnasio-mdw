import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cerrarVisitasDelDia } from "@/lib/db/visitas";
import { responderError } from "@/lib/errores";

/**
 * H3 — el cierre diario de visitas olvidadas.
 *
 * Sin `requerirUsuario` A PROPÓSITO: lo llama un proceso programado, no una
 * persona. Se autentica con el secreto compartido `CRON_SECRET`, que puede
 * llegar de dos formas:
 *
 *   Authorization: Bearer <CRON_SECRET>   así lo manda Vercel Cron (vercel.json)
 *   x-cron-secret: <CRON_SECRET>           así lo prueba el equipo (docs/api.http)
 *
 * Responde a GET y a POST con la misma lógica. GET porque Vercel Cron solo
 * sabe llamar con GET; que un GET modifique datos no es lo ideal en REST,
 * pero acá no lo dispara un navegador ni un buscador: sin el secreto, 401.
 *
 * Correrlo todos los días tiene un efecto más: la base recibe al menos una
 * consulta diaria, y Supabase (plan gratis) no llega a pausarla por 7 días de
 * inactividad.
 */
function secretoRecibido(request: Request): string | null {
  const autorizacion = request.headers.get("authorization");
  if (autorizacion?.startsWith("Bearer ")) return autorizacion.slice("Bearer ".length);
  return request.headers.get("x-cron-secret");
}

/** Compara en tiempo constante: la respuesta no revela cuántos caracteres coincidieron. */
function esElSecreto(recibido: string | null): boolean {
  const esperado = process.env.CRON_SECRET;
  if (!esperado || !recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function cerrar(request: Request) {
  try {
    if (!esElSecreto(secretoRecibido(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const resultado = await cerrarVisitasDelDia(new Date());
    return NextResponse.json({ visitasCerradas: resultado.count });
  } catch (error) {
    return responderError(`${request.method} /api/visitas/cierre-diario`, error);
  }
}

export async function GET(request: Request) {
  return cerrar(request);
}

export async function POST(request: Request) {
  return cerrar(request);
}
