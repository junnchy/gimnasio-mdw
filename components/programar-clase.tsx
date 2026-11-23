"use client";

import { useActionState, useId } from "react";
import { programarClaseAction } from "@/app/(app)/clases/nueva/acciones";
import { CampoFormulario } from "@/components/campo-formulario";
import { EstadoFormulario } from "@/components/estado-formulario";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/schemas/formulario";

const CAMPO = "min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive";

/** El formulario de /clases/nueva. Las reglas las valida el servidor con `programarClaseFormSchema`. */
export function ProgramarClase() {
  const [estado, enviar, pendiente] = useActionState(programarClaseAction, SIN_ENVIAR);
  const base = useId();
  const error = (campo: string) => estado.errores?.[campo]?.join(" ");
  const valor = (campo: string, porDefecto = "") => estado.valores?.[campo] ?? porDefecto;
  // Con `key`, los defaultValue vuelven a leerse después de cada envío fallido.
  const version = JSON.stringify(estado.valores ?? {});

  return (
    <form action={enviar} className="max-w-xl space-y-6" aria-busy={pendiente} key={version}>
      <EstadoFormulario estado={estado} />
      <CampoFormulario id={`${base}-nombre`} etiqueta="Nombre de la clase" error={error("nombre")} ayuda="Por ejemplo, Spinning o Funcional.">
        {(aria) => <input {...aria} name="nombre" defaultValue={valor("nombre")} required minLength={2} maxLength={80} disabled={pendiente} className={CAMPO} />}
      </CampoFormulario>
      <CampoFormulario id={`${base}-inicio`} etiqueta="Día y hora" error={error("inicio")} ayuda="Hora del gimnasio (Argentina).">
        {(aria) => <input {...aria} name="inicio" type="datetime-local" defaultValue={valor("inicio")} required disabled={pendiente} className={CAMPO} />}
      </CampoFormulario>
      <div className="grid gap-6 sm:grid-cols-2">
        <CampoFormulario id={`${base}-duracion`} etiqueta="Duración (minutos)" error={error("duracionMin")}>
          {(aria) => <input {...aria} name="duracionMin" type="number" inputMode="numeric" min={1} max={480} defaultValue={valor("duracionMin", "60")} required disabled={pendiente} className={CAMPO} />}
        </CampoFormulario>
        <CampoFormulario id={`${base}-cupo`} etiqueta="Cupo" error={error("cupoMaximo")} ayuda="Cuántos socios pueden reservar.">
          {(aria) => <input {...aria} name="cupoMaximo" type="number" inputMode="numeric" min={1} max={500} defaultValue={valor("cupoMaximo", "15")} required disabled={pendiente} className={CAMPO} />}
        </CampoFormulario>
      </div>
      <CampoFormulario id={`${base}-sala`} etiqueta="Sala (opcional)" error={error("sala")}>
        {(aria) => <input {...aria} name="sala" defaultValue={valor("sala")} maxLength={50} disabled={pendiente} className={CAMPO} />}
      </CampoFormulario>
      <Button type="submit" disabled={pendiente} className="min-h-12 w-full sm:w-auto">
        {pendiente ? "Programando…" : "Programar clase"}
      </Button>
    </form>
  );
}
