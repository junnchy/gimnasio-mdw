"use client";

import { useActionState, useId } from "react";
import { registrarPagoAction } from "@/app/(app)/socios/[id]/acciones";
import { CampoFormulario } from "@/components/campo-formulario";
import { EstadoFormulario } from "@/components/estado-formulario";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/schemas/formulario";

const CAMPO = "min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive";

/**
 * Cobrar la cuota de la membresía actual (/socios/:id, ADMIN, H7).
 * EFECTIVO renueva al instante; Mercado Pago devuelve un link de cobro y la
 * membresía se renueva cuando el webhook confirma el pago (spec §8).
 */
export function RegistrarPago({ socioId, membresiaId, montoSugerido }: { socioId: string; membresiaId: string; montoSugerido: number }) {
  const [estado, enviar, pendiente] = useActionState(registrarPagoAction, SIN_ENVIAR);
  const base = useId();
  const error = (campo: string) => estado.errores?.[campo]?.join(" ");
  const medio = estado.valores?.medio ?? "EFECTIVO";

  return (
    <form action={enviar} className="space-y-5" aria-busy={pendiente} key={JSON.stringify(estado.valores ?? {})}>
      <EstadoFormulario estado={estado} />
      <input type="hidden" name="socioId" value={socioId} />
      <input type="hidden" name="membresiaId" value={membresiaId} />
      <CampoFormulario id={`${base}-monto`} etiqueta="Monto (ARS)" error={error("monto")} ayuda="Por defecto, el precio del plan.">
        {(aria) => (
          <input {...aria} name="monto" type="number" inputMode="decimal" min={0.01} step={0.01}
            defaultValue={estado.valores?.monto ?? String(montoSugerido)} required disabled={pendiente} className={CAMPO} />
        )}
      </CampoFormulario>
      <fieldset className="space-y-2" aria-describedby={error("medio") ? `${base}-medio-error` : undefined}>
        <legend className="font-medium">Medio de pago</legend>
        <label className="flex min-h-11 items-center gap-3">
          <input type="radio" name="medio" value="EFECTIVO" defaultChecked={medio === "EFECTIVO"} disabled={pendiente} className="size-5 accent-primary" />
          Efectivo: el socio pagó en recepción y la membresía se renueva ahora
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input type="radio" name="medio" value="MP" defaultChecked={medio === "MP"} disabled={pendiente} className="size-5 accent-primary" />
          Mercado Pago: generamos un link de cobro para mandarle al socio
        </label>
        {error("medio") ? <p id={`${base}-medio-error`} className="text-sm text-destructive" role="alert">{error("medio")}</p> : null}
      </fieldset>
      <Button type="submit" disabled={pendiente} className="min-h-12 w-full sm:w-auto">
        {pendiente ? "Registrando el pago…" : "Registrar pago"}
      </Button>
    </form>
  );
}
