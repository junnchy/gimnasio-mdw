import { FiltroClases } from "@/components/filtro-clases";
import { SinDatos } from "@/components/sin-datos";
import { listarProximasClases } from "@/lib/db/clases";
import { aFilaClase } from "@/lib/filaClase";

/**
 * El inicio de profesor y admin (clase 10): las próximas clases del gimnasio.
 *
 * "Ver clases" es de cualquiera con sesión (matriz de docs/api.md), así que
 * la consulta es la misma para los dos roles. `usuarioId` sale de la sesión y
 * solo sirve para marcar las clases que dicta quien mira.
 *
 * Las filas se arman acá, en el servidor (`aFilaClase`): fechas en la hora
 * del gimnasio y sin los ids de los profesores, que no tienen por qué viajar
 * al navegador.
 */
export async function PanelClases({ usuarioId, esProfesor }: { usuarioId: string; esProfesor: boolean }) {
  const clases = (await listarProximasClases(new Date())).map((clase) => aFilaClase(clase, usuarioId));

  return (
    <section aria-labelledby="titulo-clases">
      <h2 id="titulo-clases" className="text-lg font-bold">
        Próximas clases
      </h2>
      {/* Vacío (no hay ninguna) lo decide el servidor; "sin resultados" (hay, pero el filtro no encontró), FiltroClases. */}
      {clases.length === 0 ? (
        <div className="mt-4">
          <SinDatos
            titulo="No hay clases programadas"
            detalle="Cuando un profesor programe una clase, la vas a ver acá con su horario y su cupo."
          />
        </div>
      ) : (
        <FiltroClases clases={clases} mostrarMias={esProfesor} />
      )}
    </section>
  );
}
