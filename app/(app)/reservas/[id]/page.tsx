import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CancelarReserva } from "@/components/cancelar-reserva";
import { puedeCancelar } from "@/lib/reserva";
import { InsigniaReserva } from "@/components/insignia-reserva";
import { SoloSocios } from "@/components/solo-socios";
import { VolverAReservas } from "@/components/volver-a-reservas";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requerirUsuarioEnPantalla } from "@/lib/auth";
import { obtenerReservaDeSocio } from "@/lib/db/reservas";
import { aFilaReserva } from "@/lib/filaReserva";
import { id } from "@/lib/schemas/_common";

export const metadata: Metadata = { title: "Reserva" };

type Props = { params: Promise<{ id: string }> };

/**
 * Detalle de una reserva propia (clase 8). Mismo criterio que la API:
 * sin sesión → login (el 401 de la API); no existe o es de otro socio →
 * 404 en los dos casos, para no confirmar que el id existe.
 */
export default async function DetalleReserva({ params }: Props) {
  const { id: reservaId } = await params;
  const usuario = await requerirUsuarioEnPantalla(`/reservas/${reservaId}`);

  if (usuario.rol !== "SOCIO") {
    return (
      <div>
        <SoloSocios />
      </div>
    );
  }

  if (!id.safeParse(reservaId).success) notFound();
  // El id del socio va en el WHERE: una reserva ajena vuelve null, igual que una inexistente.
  const reserva = await obtenerReservaDeSocio(reservaId, usuario.id);
  if (!reserva) notFound();

  const fila = aFilaReserva(reserva);

  return (
    <div>
      <VolverAReservas />
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-bold">{fila.clase}</h1>
          </CardTitle>
          <CardDescription>{fila.fecha}</CardDescription>
          <CardAction>
            <InsigniaReserva estado={fila.estado} presente={fila.presente} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-muted-foreground">Horario</dt>
            <dd>{fila.horario}</dd>
            <dt className="text-muted-foreground">Sala</dt>
            <dd>{fila.sala ?? "Sin asignar"}</dd>
            <dt className="text-muted-foreground">Asistencia</dt>
            <dd>{fila.presente ? "Registrada" : "Sin registrar"}</dd>
          </dl>
          <CancelarReserva reservaId={reserva.id} habilitada={puedeCancelar({ estado: reserva.estado, claseInicio: reserva.clase.inicio }, new Date()).ok} />
        </CardContent>
      </Card>
    </div>
  );
}
