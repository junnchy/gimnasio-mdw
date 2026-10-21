import { FiltroReservas } from "@/components/filtro-reservas";
import { SinDatos } from "@/components/sin-datos";
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

  // Vacío: lo decide el servidor, que sabe que no hay ninguna. "Sin
  // resultados" (hay, pero el filtro no encontró) lo resuelve FiltroReservas.
  if (reservas.length === 0) {
    return (
      <div className="mt-6">
        <SinDatos
          titulo="Todavía no tenés reservas"
          detalle="Cuando reserves una clase, la vas a ver acá con su horario y su estado."
        />
      </div>
    );
  }

  return <FiltroReservas reservas={reservas} />;
}
