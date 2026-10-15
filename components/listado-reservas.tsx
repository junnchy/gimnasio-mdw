import { FiltroReservas } from "@/components/filtro-reservas";
import { listarReservasDeSocio } from "@/lib/db/reservas";
import { aFilaReserva } from "@/lib/filaReserva";

/**
 * Las reservas del socio, leídas en el servidor (Server Component async).
 * Va dentro de un <Suspense> para que el esqueleto se vea mientras consulta.
 *
 * `socioId` tiene que salir SIEMPRE de la sesión (`requerirUsuarioEnPantalla`),
 * nunca de la URL ni de un formulario: es el id que va en el WHERE.
 */
export async function ListadoReservas({ socioId }: { socioId: string }) {
  const reservas = (await listarReservasDeSocio(socioId)).map(aFilaReserva);

  if (reservas.length === 0) {
    return (
      <p className="mt-6 text-muted-foreground">
        Todavía no tenés reservas. Cuando reserves una clase, la vas a ver acá.
      </p>
    );
  }

  return <FiltroReservas reservas={reservas} />;
}
