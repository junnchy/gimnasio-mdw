import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoListado } from "@/components/esqueleto-listado";
import { ListadoVisitas } from "@/components/listado-visitas";
import { SeccionRestringida } from "@/components/seccion-restringida";
import { requerirUsuarioEnPantalla } from "@/lib/auth";

export const metadata: Metadata = { title: "Ingresos" };

/**
 * Ingresos al gimnasio para recepción (ADMIN): quién está adentro ahora y
 * los últimos movimientos (flujo principal §5, punto 6). Solo lectura.
 *
 * El rol se verifica ANTES de consultar: a otro rol no se le lee nada.
 */
export default async function Ingresos() {
  const usuario = await requerirUsuarioEnPantalla("/visitas");
  if (usuario.rol !== "ADMIN") return <SeccionRestringida para="administración" />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Ingresos</h1>
      <p className="mt-1 text-muted-foreground">Quién está entrenando y los últimos ingresos y salidas por QR.</p>
      <Suspense fallback={<EsqueletoListado que="los ingresos" />}>
        <ListadoVisitas />
      </Suspense>
    </div>
  );
}
