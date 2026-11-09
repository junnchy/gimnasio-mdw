"use client";

/**
 * Los socios con un filtro por estado de membresía (ADMIN, /socios). Es el
 * estado "sin resultados" de esa pantalla: el único que sabe qué filtro se
 * eligió es este componente. Filtra en memoria las filas que ya llegaron con
 * el HTML (como `FiltroClases`).
 */
import { useState } from "react";
import { InsigniaMembresia } from "@/components/insignia-membresia";
import { Button } from "@/components/ui/button";
import { FILTROS_SOCIO, filtrarSocios, type FilaSocio, type FiltroSocio } from "@/lib/filaSocio";

const ETIQUETAS: Record<FiltroSocio, string> = {
  TODOS: "Todos",
  ACTIVAS: "Al día",
  VENCIDAS: "Vencidas",
  SIN_MEMBRESIA: "Sin membresía",
};

export function FiltroSocios({ socios }: { socios: FilaSocio[] }) {
  const [filtro, setFiltro] = useState<FiltroSocio>("TODOS");
  const visibles = filtrarSocios(socios, filtro);

  return (
    <div className="mt-6">
      <div role="group" aria-label="Filtrar socios por membresía" className="flex flex-wrap gap-2">
        {FILTROS_SOCIO.map((opcion) => (
          <Button
            key={opcion}
            variant={filtro === opcion ? "default" : "outline"}
            aria-pressed={filtro === opcion}
            onClick={() => setFiltro(opcion)}
          >
            {ETIQUETAS[opcion]} ({filtrarSocios(socios, opcion).length})
          </Button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {visibles.length === 1 ? "1 socio" : `${visibles.length} socios`}
      </p>

      {visibles.length === 0 ? (
        <p className="mt-4">Ningún socio coincide con este filtro. Probá con «Todos».</p>
      ) : (
        <ul className="mt-2 divide-y rounded-xl ring-1 ring-foreground/10">
          {visibles.map((socio) => (
            <li key={socio.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium break-words">{socio.nombre}</p>
                <p className="text-sm break-all text-muted-foreground">{socio.email}</p>
                <p className="text-sm text-muted-foreground">
                  {socio.plan ? `${socio.plan} · ${socio.vencimiento}` : "Nunca tuvo una membresía"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {socio.ultimaVisita ? `Última visita: ${socio.ultimaVisita}` : "Todavía no vino al gimnasio"}
                </p>
              </div>
              <InsigniaMembresia estado={socio.estado} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
