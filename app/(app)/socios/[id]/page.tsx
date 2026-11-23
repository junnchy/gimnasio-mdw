import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AsignarPlan } from "@/components/asignar-plan";
import { InsigniaMembresia } from "@/components/insignia-membresia";
import { InsigniaPago } from "@/components/insignia-pago";
import { RegistrarPago } from "@/components/registrar-pago";
import { SeccionRestringida } from "@/components/seccion-restringida";
import { SinDatos } from "@/components/sin-datos";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requerirUsuarioEnPantalla } from "@/lib/auth";
import { listarPlanes } from "@/lib/db/planes";
import { obtenerSocioConMembresia } from "@/lib/db/socios";
import { estadoMembresiaVista } from "@/lib/membresia";
import { id } from "@/lib/schemas/_common";
import { formatearFecha, formatearMonto, hoyEnArgentina } from "@/lib/utils";

export const metadata: Metadata = { title: "Membresía del socio" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ asignado?: string | string[] }> };

const MEDIO = { EFECTIVO: "Efectivo", MP: "Mercado Pago" } as const;

/**
 * La membresía de un socio y sus pagos (ADMIN, H7). Si no tiene membresía o
 * está CANCELADA, se le asigna un plan; si tiene una, se cobra la cuota.
 *
 * Sin <Suspense>: la consulta va antes de cualquier streaming para que el 404
 * salga con su status (regla de AGENTS.md). Un id que no es de un socio
 * responde lo mismo que uno que no existe.
 */
export default async function SocioDetalle({ params, searchParams }: Props) {
  const { id: socioId } = await params;
  const usuario = await requerirUsuarioEnPantalla(`/socios/${socioId}`);
  if (usuario.rol !== "ADMIN") return <SeccionRestringida para="administración" />;

  if (!id.max(128).safeParse(socioId).success) notFound();
  const [socio, planes] = await Promise.all([obtenerSocioConMembresia(usuario, socioId), listarPlanes()]);
  if (!socio) notFound();

  const ahora = new Date();
  const membresia = socio.membresias[0];
  const estado = membresia ? estadoMembresiaVista(membresia, ahora) : null;
  const puedeCobrar = membresia && estado !== "CANCELADA";
  const { asignado } = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/socios" className="text-sm font-medium underline underline-offset-4">
          Volver a los socios
        </Link>
        <h1 className="mt-4 text-2xl font-bold break-words">{socio.nombre}</h1>
        <p className="mt-1 break-all text-muted-foreground">{socio.email}</p>
      </div>

      {asignado && membresia ? (
        <Alert role="status">
          <AlertTitle>Plan asignado. La membresía vence el {formatearFecha(membresia.fechaFin)}.</AlertTitle>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-bold">Membresía</h2>
          </CardTitle>
          <CardDescription>
            {!membresia
              ? "Todavía no tiene un plan asignado."
              : estado === "CANCELADA"
                ? `${membresia.plan.nombre} · Cancelada`
                : `${membresia.plan.nombre} · ${estado === "ACTIVA" ? "Vence" : "Venció"} el ${formatearFecha(membresia.fechaFin)}`}
          </CardDescription>
          <CardAction>
            <InsigniaMembresia estado={estado} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {puedeCobrar ? (
            <section aria-labelledby="titulo-cobrar">
              <h3 id="titulo-cobrar" className="mb-4 font-semibold">Registrar un pago</h3>
              <RegistrarPago socioId={socio.id} membresiaId={membresia.id} montoSugerido={Number(membresia.plan.precio)} />
            </section>
          ) : (
            <section aria-labelledby="titulo-asignar">
              <h3 id="titulo-asignar" className="mb-4 font-semibold">Asignar un plan</h3>
              <AsignarPlan
                socioId={socio.id}
                hoy={hoyEnArgentina(ahora)}
                planes={planes.map((plan) => ({
                  id: plan.id,
                  nombre: plan.nombre,
                  detalle: `${formatearMonto(Number(plan.precio))} · ${plan.duracionDias} días`,
                }))}
              />
            </section>
          )}
        </CardContent>
      </Card>

      {membresia ? (
        <section aria-labelledby="titulo-pagos">
          <h2 id="titulo-pagos" className="text-lg font-bold">Pagos de esta membresía</h2>
          {membresia.pagos.length === 0 ? (
            <div className="mt-3">
              <SinDatos titulo="Todavía no hay pagos" detalle="Cuando registres un pago, aparece acá con su medio y su estado." />
            </div>
          ) : (
            <ol className="mt-3 divide-y rounded-xl ring-1 ring-foreground/10">
              {membresia.pagos.map((pago) => (
                <li key={pago.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">{formatearMonto(Number(pago.monto))}</p>
                    <p className="text-sm text-muted-foreground">{MEDIO[pago.medio]} · {formatearFecha(pago.fecha)}</p>
                  </div>
                  <InsigniaPago estado={pago.estado} />
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}
    </div>
  );
}
