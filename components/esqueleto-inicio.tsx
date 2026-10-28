import { Skeleton } from "@/components/ui/skeleton";

/**
 * El estado "cargando" del inicio (clase 10): la forma del panel mientras se
 * lee la base, para que la pantalla no salte cuando llega el contenido.
 *
 * Va como fallback de un <Suspense> dentro de la página y NO como
 * `app/(app)/loading.tsx`: un loading.tsx en (app) envolvería también a
 * /reservas/:id, y su 404 saldría con status 200 (regla de AGENTS.md).
 */
export function EsqueletoInicio() {
  return (
    <div className="space-y-10" aria-busy="true">
      <Skeleton className="h-24 w-full" />
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <p className="sr-only" role="status">
        Cargando tu inicio…
      </p>
    </div>
  );
}
