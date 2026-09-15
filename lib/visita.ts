/**
 * Reglas de negocio de las visitas por QR (H1, H2, H3 y flujo principal §5).
 *
 * Funciones puras: sin Prisma, sin Next, sin `new Date()` adentro.
 */
import { membresiaHabilita, type EstadoMembresiaVista } from "@/lib/membresia";
import { veredicto, type Motivo, type Veredicto } from "@/lib/reglas";

/** H2: un segundo escaneo dentro de esta ventana se rechaza (debounce). */
export const DEBOUNCE_ESCANEO_SEGUNDOS = 60;

export type EstadoVisita = "ABIERTA" | "CERRADA" | "INCOMPLETA";

export type CodigoRechazoEscaneo = "QR_INVALIDO" | "MEMBRESIA_INACTIVA" | "ESCANEO_DUPLICADO";

/**
 * Regla del ADR 0003: la duración de una visita no se guarda, se calcula.
 *
 * Es la diferencia entre los dos hechos (ingresoAt, egresoAt). Si mañana un
 * admin corrige el egreso a mano, una duración guardada quedaría mintiendo;
 * calculada, nunca. Las visitas INCOMPLETA (sin egreso) no computan.
 */
export function calcularDuracionMin(ingresoAt: Date, egresoAt: Date): number {
  return Math.round((egresoAt.getTime() - ingresoAt.getTime()) / 60000);
}

/**
 * H1/H2, flujo §5 puntos 3 y 4: el mismo QR abre o cierra según el estado del
 * socio. El servidor decide, no el cliente.
 */
export function accionDeEscaneo(hayVisitaAbierta: boolean): "ABRIR" | "CERRAR" {
  return hayVisitaAbierta ? "CERRAR" : "ABRIR";
}

/**
 * H1: el QR de la puerta es fijo; el token que llega tiene que ser el esperado.
 * Si no hay token configurado, nada valida: falla cerrado.
 */
export function tokenQrValido(token: string, tokenEsperado: string): boolean {
  return tokenEsperado.length > 0 && token === tokenEsperado;
}

export function segundosDesde(momento: Date, ahora: Date): number {
  return Math.floor((ahora.getTime() - momento.getTime()) / 1000);
}

/**
 * H1 + H2 — condiciones para aceptar un escaneo.
 *
 * `ultimoMovimientoAt` es el ingreso o el egreso más reciente del socio: el
 * debounce mira el último movimiento, no solo el ingreso, porque si no un
 * egreso seguido de un ingreso inmediato pasaría.
 *
 * La condición de membresía es de H1 (el INGRESO); H2 no le pone ninguna
 * condición al egreso más allá del debounce. Por eso hace falta saber si el
 * socio ya está adentro: a un socio cuya cuota venció mientras entrenaba hay
 * que dejarlo salir, o su visita queda ABIERTA hasta que el cierre diario la
 * fuerce a INCOMPLETA y se pierde la duración real.
 */
export function puedeEscanear(
  datos: {
    readonly estadoMembresia: EstadoMembresiaVista | null;
    readonly token: string;
    readonly tokenEsperado: string;
    readonly ultimoMovimientoAt: Date | null;
    readonly hayVisitaAbierta: boolean;
  },
  ahora: Date,
): Veredicto<CodigoRechazoEscaneo> {
  const motivos: Motivo<CodigoRechazoEscaneo>[] = [];

  if (!tokenQrValido(datos.token, datos.tokenEsperado)) {
    motivos.push({ codigo: "QR_INVALIDO", mensaje: "QR inválido o vencido." });
  }

  // Solo al ingresar (H1). Salir siempre se permite.
  if (accionDeEscaneo(datos.hayVisitaAbierta) === "ABRIR" && !membresiaHabilita(datos.estadoMembresia)) {
    motivos.push({
      codigo: "MEMBRESIA_INACTIVA",
      mensaje: "Membresía vencida: no se puede registrar el ingreso.",
      datos: { estadoMembresia: datos.estadoMembresia },
    });
  }

  if (datos.ultimoMovimientoAt) {
    const transcurridos = segundosDesde(datos.ultimoMovimientoAt, ahora);
    if (transcurridos < DEBOUNCE_ESCANEO_SEGUNDOS) {
      motivos.push({
        codigo: "ESCANEO_DUPLICADO",
        mensaje: "Escaneo repetido: esperá unos segundos.",
        datos: {
          segundosTranscurridos: transcurridos,
          segundosRestantes: DEBOUNCE_ESCANEO_SEGUNDOS - transcurridos,
        },
      });
    }
  }

  return veredicto(motivos);
}

/**
 * H3 — corte del día para el cierre automático de visitas olvidadas.
 *
 * Vercel corre en UTC: sin fijar el timezone del gimnasio, "el día" arrancaría
 * a las 21:00 del día anterior. Argentina mantiene UTC-3 todo el año.
 */
export function inicioDelDiaArgentina(ahora: Date): Date {
  const partes = new Intl.DateTimeFormat("en", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const fecha = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return new Date(Date.UTC(Number(fecha.year), Number(fecha.month) - 1, Number(fecha.day), 3));
}

/** El dato que se muestra: solo una visita CERRADA tiene duración (ADR 0003). */
export function duracionDeVisita(visita: {
  ingresoAt: Date;
  egresoAt: Date | null;
  estado: EstadoVisita;
}): number | null {
  return visita.estado === "CERRADA" && visita.egresoAt
    ? calcularDuracionMin(visita.ingresoAt, visita.egresoAt)
    : null;
}
