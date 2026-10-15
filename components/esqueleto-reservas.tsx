import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mientras se leen las reservas: la forma del listado, nunca la pantalla en blanco.
 *
 * Va en un <Suspense> dentro de la página y NO como `loading.tsx`: con
 * `loading.tsx` Next manda el esqueleto antes de chequear la sesión, el status
 * ya salió como 200 y la redirección al login (307) y el 404 llegan tarde,
 * metidos en el stream.
 */
export function EsqueletoReservas() {
  return (
    <div className="mt-6" aria-busy="true">
      <p className="sr-only">Cargando tus reservas…</p>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
