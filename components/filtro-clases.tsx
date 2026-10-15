"use client";

/**
 * Las próximas clases con un filtro (clase 10), para el inicio de profesor y
 * admin. Es el estado "sin resultados" de esa pantalla: el único que sabe qué
 * filtro se eligió es este componente.
 *
 * Por qué es de cliente: recuerda el filtro elegido (estado) y responde al
 * clic (evento). Filtra en memoria las filas que ya llegaron con el HTML, sin
 * requests: alcanza porque `listarProximasClases` trae como mucho 50.
 *
 * "Mis clases" se ofrece solo al profesor; que la opción no esté no protege
 * nada, solo evita un filtro que para el admin siempre daría vacío.
 */
import { useState } from "react";
import { CircleUser, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FILTROS_CLASE, filtrarClases, type FilaClase, type FiltroClase } from "@/lib/filaClase";

const ETIQUETAS: Record<FiltroClase, string> = {
  TODAS: "Todas",
  CON_LUGAR: "Con lugar",
  MIAS: "Mis clases",
};

export function FiltroClases({ clases, mostrarMias }: { clases: FilaClase[]; mostrarMias: boolean }) {
  const [filtro, setFiltro] = useState<FiltroClase>("TODAS");
  const visibles = filtrarClases(clases, filtro);
  const opciones = FILTROS_CLASE.filter((opcion) => opcion !== "MIAS" || mostrarMias);

  return (
    <div className="mt-4">
      <div role="group" aria-label="Filtrar clases" className="flex flex-wrap gap-2">
        {opciones.map((opcion) => (
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
        {visibles.length === 1 ? "1 clase" : `${visibles.length} clases`}
      </p>

      {visibles.length === 0 ? (
        <p className="mt-4">Ninguna clase coincide con este filtro. Probá con «Todas».</p>
      ) : (
        <ul className="mt-2 divide-y rounded-xl ring-1 ring-foreground/10">
          {visibles.map((clase) => (
            <li key={clase.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium break-words">{clase.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {clase.fecha} · {clase.horario}
                  {clase.sala ? ` · ${clase.sala}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">Profesor: {clase.profesor}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {clase.esMia ? (
                  <Badge>
                    <CircleUser aria-hidden="true" />
                    Tu clase
                  </Badge>
                ) : null}
                <Badge variant={clase.sinCupo ? "destructive" : "secondary"}>
                  <Users aria-hidden="true" />
                  {clase.sinCupo ? "Sin cupo" : `${clase.ocupados} de ${clase.cupo} lugares`}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
