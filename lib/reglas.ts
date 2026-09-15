/**
 * Vocabulario común de las reglas de negocio (clase 5).
 *
 * Una regla no devuelve un booleano: devuelve el conjunto de motivos por los
 * que la operación NO se puede hacer. Eso permite que la respuesta 409 lleve
 * datos estructurados (códigos y datos) además del mensaje para el humano, así
 * el front puede actuar sobre ellos sin parsear texto.
 *
 * Los motivos son "errores esperados": son un resultado del negocio, no una
 * falla del sistema. Por eso se devuelven como valor y nunca se lanzan.
 */

export type Motivo<Codigo extends string = string> = {
  /** Código estable, para que el front decida qué hacer. */
  readonly codigo: Codigo;
  /** Mensaje para la persona. Tiene que coincidir con el catálogo de `docs/api.md`. */
  readonly mensaje: string;
  /** Datos que el front necesita para actuar (cupos, nombres de clases, segundos). */
  readonly datos?: Readonly<Record<string, unknown>>;
};

export type Veredicto<Codigo extends string = string> = {
  readonly ok: boolean;
  readonly motivos: readonly Motivo<Codigo>[];
};

/** Construye el veredicto: sin motivos, la operación se puede hacer. */
export function veredicto<Codigo extends string>(
  motivos: readonly Motivo<Codigo>[],
): Veredicto<Codigo> {
  return { ok: motivos.length === 0, motivos };
}
