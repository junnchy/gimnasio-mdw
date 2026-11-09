import { FiltroSocios } from "@/components/filtro-socios";
import { SinDatos } from "@/components/sin-datos";
import { listarSociosConMembresia } from "@/lib/db/socios";
import { aFilaSocio } from "@/lib/filaSocio";

/**
 * Los socios con su membresía (ADMIN), leídos en el servidor dentro del
 * <Suspense> de /socios. La página ya verificó el rol. Las filas se arman acá
 * (`aFilaSocio`): al navegador llega texto, sin fechas crudas ni ids de plan.
 */
export async function ListadoSocios() {
  const ahora = new Date();
  const socios = (await listarSociosConMembresia()).map((socio) => aFilaSocio(socio, ahora));

  if (socios.length === 0) {
    return (
      <div className="mt-6">
        <SinDatos
          titulo="Todavía no hay socios"
          detalle="Quien entra con Google por primera vez queda registrado como socio y aparece acá."
        />
      </div>
    );
  }

  return <FiltroSocios socios={socios} />;
}
