import { InsigniaVisita } from "@/components/insignia-visita";
import { SinDatos } from "@/components/sin-datos";
import { contarIngresosDesde, listarVisitasAbiertas, listarVisitasRecientes } from "@/lib/db/visitas";
import { aFilaVisita, type FilaVisita } from "@/lib/filaVisita";
import { inicioDelDiaArgentina } from "@/lib/visita";

/**
 * Los ingresos al gimnasio para recepción (ADMIN). Server Component async,
 * dentro del <Suspense> de /visitas. La página ya verificó el rol: estas
 * consultas devuelven visitas de todos los socios.
 *
 * "Sin salida" son las visitas que el cierre diario (H3) marcó INCOMPLETA:
 * no tienen duración, porque inventarla ensuciaría las métricas.
 */
export async function ListadoVisitas() {
  const ahora = new Date();
  const [abiertas, recientes, ingresosHoy] = await Promise.all([
    listarVisitasAbiertas(),
    listarVisitasRecientes(),
    contarIngresosDesde(inicioDelDiaArgentina(ahora)),
  ]);

  if (recientes.length === 0) {
    return (
      <div className="mt-6">
        <SinDatos
          titulo="Todavía no hay ingresos"
          detalle="Cuando un socio escanee el QR de la puerta, su ingreso y su salida aparecen acá."
        />
      </div>
    );
  }

  const adentro = abiertas.map((visita) => aFilaVisita(visita, ahora));
  const movimientos = recientes.map((visita) => aFilaVisita(visita, ahora));

  return (
    <div className="mt-6 space-y-10">
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 ring-1 ring-foreground/10">
          <dt className="text-sm text-muted-foreground">Adentro ahora</dt>
          <dd className="mt-1 font-heading text-3xl font-bold tabular-nums">{adentro.length}</dd>
        </div>
        <div className="rounded-xl p-4 ring-1 ring-foreground/10">
          <dt className="text-sm text-muted-foreground">Ingresos de hoy</dt>
          <dd className="mt-1 font-heading text-3xl font-bold tabular-nums">{ingresosHoy}</dd>
        </div>
      </dl>

      <section aria-labelledby="titulo-adentro">
        <h2 id="titulo-adentro" className="text-lg font-bold">
          Adentro ahora
        </h2>
        {adentro.length === 0 ? (
          <p className="mt-2 text-muted-foreground">No hay nadie entrenando en este momento.</p>
        ) : (
          <ListaVisitas filas={adentro} />
        )}
      </section>

      <section aria-labelledby="titulo-movimientos">
        <h2 id="titulo-movimientos" className="text-lg font-bold">
          Últimos movimientos
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Los {movimientos.length} ingresos más recientes, con su salida.</p>
        <ListaVisitas filas={movimientos} conFecha />
      </section>
    </div>
  );
}

function ListaVisitas({ filas, conFecha = false }: { filas: FilaVisita[]; conFecha?: boolean }) {
  return (
    <ul className="mt-3 divide-y rounded-xl ring-1 ring-foreground/10">
      {filas.map((fila) => (
        <li key={fila.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-medium break-words">{fila.socio}</p>
            <p className="text-sm break-all text-muted-foreground">{fila.email}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {conFecha ? `${fila.fecha} · ` : ""}
              Entró {fila.ingreso}
              {fila.egreso ? ` · Salió ${fila.egreso}` : ""}
              {fila.tiempo ? (fila.estado === "ABIERTA" ? ` · hace ${fila.tiempo}` : ` · ${fila.tiempo}`) : ""}
            </p>
          </div>
          <InsigniaVisita estado={fila.estado} />
        </li>
      ))}
    </ul>
  );
}
