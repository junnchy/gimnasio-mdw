import Link from "next/link";
import { FiltroSocios } from "@/components/filtro-socios";
import { SinDatos } from "@/components/sin-datos";
import { listarSociosConMembresia } from "@/lib/db/socios";
import { aFilaSocio } from "@/lib/filaSocio";
import type { RolUsuario } from "@/lib/schemas/_common";

/**
 * Los socios con su membresía (ADMIN), leídos en el servidor dentro del
 * <Suspense> de /socios. Las filas se arman acá (`aFilaSocio`): al navegador
 * llega texto, sin fechas crudas ni ids de plan.
 *
 *   vacío           no hay ningún socio (lo decide el servidor)
 *   sin resultados  la búsqueda no encontró a nadie (acá) o el filtro por
 *                   estado no dejó a nadie (FiltroSocios)
 */
export async function ListadoSocios({ quien, busqueda }: { quien: { rol: RolUsuario }; busqueda?: string }) {
  const ahora = new Date();
  const { socios, total } = await listarSociosConMembresia(quien, { busqueda });
  const filas = socios.map((socio) => aFilaSocio(socio, ahora));

  if (total === 0 && busqueda) {
    return (
      <p className="mt-6">
        Ningún socio coincide con «{busqueda}». Revisá cómo está escrito o{" "}
        <Link href="/socios" className="underline underline-offset-4">
          mirá todos
        </Link>
        .
      </p>
    );
  }

  if (total === 0) {
    return (
      <div className="mt-6">
        <SinDatos
          titulo="Todavía no hay socios"
          detalle="Quien entra con Google por primera vez queda registrado como socio y aparece acá."
        />
      </div>
    );
  }

  return <FiltroSocios socios={filas} total={total} />;
}
