"use client";

import { useActionState, useId } from "react";
import { asignarMembresiaAction } from "@/app/(app)/socios/[id]/acciones";
import { CampoFormulario } from "@/components/campo-formulario";
import { EstadoFormulario } from "@/components/estado-formulario";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/schemas/formulario";

export type OpcionPlan = { id: string; nombre: string; detalle: string };

const CAMPO = "min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive";

/** Asignar un plan a un socio sin membresía o con la membresía cancelada (/socios/:id, ADMIN). */
export function AsignarPlan({ socioId, planes, hoy }: { socioId: string; planes: OpcionPlan[]; hoy: string }) {
  const [estado, enviar, pendiente] = useActionState(asignarMembresiaAction, SIN_ENVIAR);
  const base = useId();
  const error = (campo: string) => estado.errores?.[campo]?.join(" ");

  if (planes.length === 0) {
    return <p>Todavía no hay planes cargados. Creá uno con <code>POST /api/planes</code> y volvé a esta pantalla.</p>;
  }

  return (
    <form action={enviar} className="space-y-5" aria-busy={pendiente} key={JSON.stringify(estado.valores ?? {})}>
      <EstadoFormulario estado={estado} />
      <input type="hidden" name="socioId" value={socioId} />
      <CampoFormulario id={`${base}-plan`} etiqueta="Plan" error={error("planId")}>
        {(aria) => (
          <select {...aria} name="planId" defaultValue={estado.valores?.planId ?? ""} required disabled={pendiente} className={CAMPO}>
            <option value="">Elegí un plan</option>
            {planes.map((plan) => <option key={plan.id} value={plan.id}>{plan.nombre} · {plan.detalle}</option>)}
          </select>
        )}
      </CampoFormulario>
      <CampoFormulario id={`${base}-inicio`} etiqueta="Empieza el" error={error("fechaInicio")} ayuda="La membresía dura lo que dura el plan, contado desde este día.">
        {(aria) => <input {...aria} name="fechaInicio" type="date" defaultValue={estado.valores?.fechaInicio ?? hoy} required disabled={pendiente} className={CAMPO} />}
      </CampoFormulario>
      <Button type="submit" disabled={pendiente} className="min-h-12 w-full sm:w-auto">
        {pendiente ? "Asignando…" : "Asignar plan"}
      </Button>
    </form>
  );
}
