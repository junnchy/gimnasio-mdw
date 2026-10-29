"use client";

import { useActionState, useState } from "react";
import { cancelarReservaAction } from "@/app/(app)/reservas/[id]/acciones";
import { EstadoFormulario } from "@/components/EstadoFormulario";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/schemas/formulario";

export function CancelarReserva({ reservaId, habilitada }: { reservaId: string; habilitada: boolean }) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, enviar, pendiente] = useActionState(cancelarReservaAction.bind(null, reservaId), SIN_ENVIAR);
  return (
    <div className="mt-6 space-y-4">
      <EstadoFormulario estado={estado} />
      {habilitada && estado.estado !== "EXITO" ? confirmando ? (
        <form action={enviar} className="space-y-4 rounded-xl border p-5" aria-busy={pendiente}>
          <p>¿Querés cancelar tu reserva? El lugar quedará disponible para otro socio.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="destructive" disabled={pendiente} className="min-h-12">{pendiente ? "Cancelando…" : "Sí, cancelar reserva"}</Button>
            <Button type="button" variant="outline" disabled={pendiente} onClick={() => setConfirmando(false)} className="min-h-12">Conservar reserva</Button>
          </div>
        </form>
      ) : <Button type="button" variant="outline" onClick={() => setConfirmando(true)} className="min-h-12 w-full sm:w-auto">Cancelar reserva</Button> : null}
    </div>
  );
}
