import { CircleUser, Users } from "lucide-react";
import { SinDatos } from "@/components/sin-datos";
import { Badge } from "@/components/ui/badge";
import { listarProximasClases } from "@/lib/db/clases";
import { formatearFecha, formatearHora } from "@/lib/utils";

/**
 * El inicio de profesor y admin (clase 10): las próximas clases del gimnasio.
 *
 * "Ver clases" es de cualquiera con sesión (matriz de docs/api.md), así que
 * la lista es la misma para los dos roles. Al profesor se le marcan las que
 * dicta él: `usuarioId` sale de la sesión, y solo decide qué insignia se ve.
 *
 * Las fechas se formatean acá, en el servidor y en la hora del gimnasio
 * (`lib/utils.ts`), igual que en las reservas.
 */
export async function PanelClases({ usuarioId }: { usuarioId: string }) {
  const clases = await listarProximasClases(new Date());

  return (
    <section aria-labelledby="titulo-clases">
      <h2 id="titulo-clases" className="text-lg font-bold">
        Próximas clases
      </h2>
      {clases.length === 0 ? (
        <div className="mt-4">
          <SinDatos
            titulo="No hay clases programadas"
            detalle="Cuando un profesor programe una clase, la vas a ver acá con su horario y su cupo."
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y rounded-xl ring-1 ring-foreground/10">
          {clases.map((clase) => {
            const fin = new Date(clase.inicio.getTime() + clase.duracionMin * 60_000);
            const ocupados = clase._count.reservas;
            const sinCupo = ocupados >= clase.cupoMaximo;

            return (
              <li key={clase.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium break-words">{clase.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatearFecha(clase.inicio)} · {formatearHora(clase.inicio)} a {formatearHora(fin)}
                    {clase.sala ? ` · ${clase.sala}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">Profesor: {clase.profesor.nombre}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {clase.profesor.id === usuarioId ? (
                    <Badge>
                      <CircleUser aria-hidden="true" />
                      Tu clase
                    </Badge>
                  ) : null}
                  <Badge variant={sinCupo ? "destructive" : "secondary"}>
                    <Users aria-hidden="true" />
                    {sinCupo ? "Sin cupo" : `${ocupados} de ${clase.cupoMaximo} lugares`}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
