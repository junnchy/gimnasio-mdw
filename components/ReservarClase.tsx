"use client";

import { useActionState, useId, useState } from "react";
import { reservarClaseAction } from "@/app/(app)/clases/acciones";
import { EstadoFormulario } from "@/components/EstadoFormulario";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/schemas/formulario";
import type { FilaClase } from "@/lib/filaClase";

export function ReservarClase({ clases }: { clases: FilaClase[] }) {
  const [estado, enviar, pendiente] = useActionState(reservarClaseAction, SIN_ENVIAR);
  const [soloConLugar, setSoloConLugar] = useState(false);
  const campoId = useId();
  const error = estado.errores?.claseId?.join(" ");
  const visibles = soloConLugar ? clases.filter((clase) => !clase.sinCupo) : clases;
  return (
    <form action={enviar} className="space-y-6" aria-busy={pendiente}>
      <EstadoFormulario estado={estado} />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" checked={soloConLugar} onChange={(evento) => setSoloConLugar(evento.target.checked)} className="size-5 accent-primary" />
        Mostrar solo clases con lugar
      </label>
      <div className="space-y-2">
        <label htmlFor={campoId} className="block font-medium">Elegí una clase</label>
        <select id={campoId} name="claseId" defaultValue={estado.valores?.claseId ?? ""}
          key={`${estado.estado}-${estado.valores?.claseId ?? ""}-${soloConLugar}`}
          aria-invalid={Boolean(error)} aria-describedby={error ? `${campoId}-error` : `${campoId}-ayuda`}
          disabled={pendiente}
          className="min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Seleccioná una clase</option>
          {visibles.map((clase) => <option key={clase.id} value={clase.id} disabled={clase.sinCupo}>
            {clase.nombre} · {clase.fecha} · {clase.horario} · {clase.sinCupo ? "Sin cupo" : `${clase.cupo - clase.ocupados} lugares`}
          </option>)}
        </select>
        <p id={`${campoId}-ayuda`} className="text-sm text-muted-foreground">El cupo se verifica nuevamente al confirmar. Mostramos hasta 50 clases próximas.</p>
        {error ? <p id={`${campoId}-error`} className="text-sm text-destructive" role="alert">{error}</p> : null}
      </div>
      {visibles.length === 0 ? <p role="status">Ninguna clase coincide con el filtro. Probá mostrar todas.</p> : null}
      <Button type="submit" disabled={pendiente} className="min-h-12 w-full sm:w-auto">
        {pendiente ? "Reservando…" : "Confirmar reserva"}
      </Button>
      <ul className="grid gap-4 sm:grid-cols-2" aria-label="Próximas clases">
        {visibles.map((clase) => <li key={clase.id} className="space-y-2 rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="font-semibold">{clase.nombre}</h2>
          <p className="text-sm">{clase.fecha} · {clase.horario}</p>
          <p className="text-sm text-muted-foreground">{clase.profesor} · {clase.sala ?? "Sala sin asignar"}</p>
          <p className="font-medium">{clase.sinCupo ? "Sin cupo" : `${clase.cupo - clase.ocupados} lugares disponibles`}</p>
        </li>)}
      </ul>
    </form>
  );
}
