import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoListado } from "@/components/esqueleto-listado";
import { ListadoSocios } from "@/components/listado-socios";
import { SeccionRestringida } from "@/components/seccion-restringida";
import { requerirUsuarioEnPantalla } from "@/lib/auth";

export const metadata: Metadata = { title: "Socios" };

/**
 * Los socios con su membresía (ADMIN): plan, estado y vencimiento. Solo
 * lectura; dar de alta membresías y pagos es la próxima entrega.
 */
export default async function Socios() {
  const usuario = await requerirUsuarioEnPantalla("/socios");
  if (usuario.rol !== "ADMIN") return <SeccionRestringida para="administración" />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Socios</h1>
      <p className="mt-1 text-muted-foreground">El estado de la membresía de cada socio y cuándo vino por última vez.</p>
      <Suspense fallback={<EsqueletoListado que="los socios" />}>
        <ListadoSocios />
      </Suspense>
    </div>
  );
}
