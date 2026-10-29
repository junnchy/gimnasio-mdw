import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InsigniaMembresia } from "@/components/insignia-membresia";
import { ListadoReservas } from "@/components/listado-reservas";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerMembresiaActual } from "@/lib/db/membresias";
import { estadoMembresiaVista } from "@/lib/membresia";
import { formatearFecha } from "@/lib/utils";

/**
 * El inicio del socio (clase 10): su membresía (H8) y sus reservas.
 *
 * Server Component async: lee la base con el id de la sesión, que recibe de
 * la página. `socioId` nunca sale de la URL ni de un formulario.
 *
 * VENCIDA se calcula acá, al leer, con la misma función que usa la API
 * (`estadoMembresiaVista`, ADR 0002): si cada pantalla tuviera su regla, un
 * día una diría "activa" y la otra "vencida" para la misma membresía.
 */
export async function PanelSocio({ socioId }: { socioId: string }) {
  const membresia = await obtenerMembresiaActual(socioId);
  const estado = membresia ? estadoMembresiaVista(membresia, new Date()) : null;

  return (
    <div className="space-y-10">
      <nav aria-label="Acciones del socio" className="flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href="/escanear" />} nativeButton={false} className="min-h-12">Escaneá el QR</Button>
        <Button render={<Link href="/clases" />} nativeButton={false} variant="outline" className="min-h-12">Reservá una clase</Button>
      </nav>
      <section aria-labelledby="titulo-membresia">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 id="titulo-membresia" className="text-lg font-bold">
                Tu membresía
              </h2>
            </CardTitle>
            <CardAction>
              <InsigniaMembresia estado={estado} />
            </CardAction>
            <CardDescription className="break-words">
              {membresia === null
                ? "Todavía no tenés una membresía. Acercate a recepción para elegir tu plan."
                : estado === "CANCELADA"
                  ? `${membresia.plan.nombre} · Cancelada. Si querés volver, consultá en recepción.`
                  : estado === "VENCIDA"
                    ? `${membresia.plan.nombre} · Venció el ${formatearFecha(membresia.fechaFin)}. Renovala en recepción para volver a entrar y reservar clases.`
                    : `${membresia.plan.nombre} · Vence el ${formatearFecha(membresia.fechaFin)}.`}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section aria-labelledby="titulo-reservas">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titulo-reservas" className="text-lg font-bold">
            Tus reservas
          </h2>
          <Link href="/reservas" className="text-sm font-medium underline underline-offset-4">
            Ver todas
          </Link>
        </div>
        <ListadoReservas socioId={socioId} />
      </section>
    </div>
  );
}
