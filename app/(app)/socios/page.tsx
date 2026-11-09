import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { EsqueletoListado } from "@/components/esqueleto-listado";
import { ListadoSocios } from "@/components/listado-socios";
import { SeccionRestringida } from "@/components/seccion-restringida";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requerirUsuarioEnPantalla } from "@/lib/auth";

export const metadata: Metadata = { title: "Socios" };

type Props = { searchParams: Promise<{ q?: string | string[] }> };

/** `?q=` viene de la URL: se valida como cualquier dato de afuera. Inválida o vacía = sin búsqueda. */
const busquedaSchema = z.string().trim().min(1).max(100);

/**
 * Los socios con su membresía (ADMIN): plan, estado y vencimiento. Solo
 * lectura; dar de alta membresías y pagos es la próxima entrega.
 *
 * La búsqueda es un formulario GET común: funciona sin JavaScript y la URL
 * con `?q=` se puede compartir. Va FUERA del <Suspense>, así se puede seguir
 * escribiendo mientras carga el listado.
 */
export default async function Socios({ searchParams }: Props) {
  const usuario = await requerirUsuarioEnPantalla("/socios");
  if (usuario.rol !== "ADMIN") return <SeccionRestringida para="administración" />;

  const { q } = await searchParams;
  const validacion = busquedaSchema.safeParse(Array.isArray(q) ? q[0] : q);
  const busqueda = validacion.success ? validacion.data : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold">Socios</h1>
      <p className="mt-1 text-muted-foreground">El estado de la membresía de cada socio y cuándo vino por última vez.</p>

      <form action="/socios" role="search" className="mt-6 flex flex-wrap gap-2">
        <label htmlFor="buscar-socio" className="sr-only">
          Buscar por nombre o mail
        </label>
        <Input
          id="buscar-socio"
          name="q"
          type="search"
          defaultValue={busqueda ?? ""}
          maxLength={100}
          placeholder="Buscar por nombre o mail"
          className="h-10 min-w-0 flex-1 basis-56"
        />
        <Button type="submit" className="h-10">
          Buscar
        </Button>
        {busqueda ? (
          <Button render={<Link href="/socios" />} nativeButton={false} variant="outline" className="h-10">
            Ver todos
          </Button>
        ) : null}
      </form>

      <Suspense key={busqueda ?? ""} fallback={<EsqueletoListado que="los socios" />}>
        <ListadoSocios quien={usuario} busqueda={busqueda} />
      </Suspense>
    </div>
  );
}
