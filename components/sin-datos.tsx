/**
 * El estado vacío, una sola vez para todo el sistema (clase 10).
 *
 * Un vacío bien resuelto dice tres cosas, y escribirlo de nuevo en cada
 * pantalla garantiza que en la tercera falte alguna:
 *
 *   1. QUÉ pasa: "Todavía no tenés reservas".
 *   2. POR QUÉ: no hay nada cargado, no es que algo falló.
 *   3. QUÉ hacer para salir de ahí (cuando hay una acción posible).
 *
 * El borde punteado distingue "este lugar va a tener contenido" de un bloque
 * que terminó. `accion` es opcional: hasta la clase 11 no hay formularios, y
 * prometer un botón que no existe es peor que no tenerlo.
 *
 * No confundir con "sin resultados" (el filtro no encontró nada): ese lo
 * resuelve el componente que tiene el filtro.
 */
export function SinDatos({
  titulo,
  detalle,
  accion,
}: {
  titulo: string;
  detalle: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-10 text-center">
      <p className="font-medium break-words">{titulo}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm break-words text-muted-foreground">{detalle}</p>
      {accion ? <div className="mt-4 flex justify-center">{accion}</div> : null}
    </div>
  );
}
