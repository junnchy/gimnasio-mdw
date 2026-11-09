import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mientras se lee un listado de staff (/visitas, /socios): la forma de la
 * lista, nunca la pantalla en blanco. Va en un <Suspense> de la página, no en
 * `loading.tsx` (ver `EsqueletoReservas`).
 */
export function EsqueletoListado({ que }: { que: string }) {
  return (
    <div className="mt-6" aria-busy="true">
      <p className="sr-only" role="status">
        Cargando {que}…
      </p>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
