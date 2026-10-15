"use client";

/**
 * Único componente de cliente de las pantallas de reservas (clase 8).
 *
 * Por qué es de cliente: guarda qué filtro eligió la persona (estado) y
 * responde al clic (evento). La página que lo usa sigue siendo de servidor
 * y le pasa las filas ya leídas de la base: filtrar no hace ningún request.
 * Alcanza porque `listarReservasDeSocio` trae como mucho 50 filas.
 */
import { useState } from "react";
import Link from "next/link";
import { InsigniaReserva } from "@/components/insignia-reserva";
import { Button } from "@/components/ui/button";
import { FILTROS_RESERVA, filtrarReservas, type FilaReserva, type FiltroReserva } from "@/lib/filaReserva";

const ETIQUETAS: Record<FiltroReserva, string> = {
  TODAS: "Todas",
  CONFIRMADA: "Confirmadas",
  CANCELADA: "Canceladas",
};

export function FiltroReservas({ reservas }: { reservas: FilaReserva[] }) {
  const [filtro, setFiltro] = useState<FiltroReserva>("TODAS");
  const visibles = filtrarReservas(reservas, filtro);

  return (
    <div className="mt-6">
      <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {FILTROS_RESERVA.map((opcion) => (
          <Button
            key={opcion}
            variant={filtro === opcion ? "default" : "outline"}
            aria-pressed={filtro === opcion}
            onClick={() => setFiltro(opcion)}
          >
            {ETIQUETAS[opcion]}
          </Button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {visibles.length === 1 ? "1 reserva" : `${visibles.length} reservas`}
      </p>

      {visibles.length === 0 ? (
        <p className="mt-4">
          Ninguna reserva coincide con este filtro. Probá con «Todas».
        </p>
      ) : (
        <ul className="mt-2 divide-y rounded-xl ring-1 ring-foreground/10">
          {visibles.map((reserva) => (
            <li key={reserva.id}>
              <Link
                href={`/reservas/${reserva.id}`}
                className="flex flex-wrap items-center justify-between gap-2 p-4 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span>
                  <span className="block font-medium">{reserva.clase}</span>
                  <span className="block text-sm text-muted-foreground">
                    {reserva.fecha} · {reserva.horario}
                  </span>
                </span>
                <InsigniaReserva estado={reserva.estado} presente={reserva.presente} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
