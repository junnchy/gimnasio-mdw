import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCheck, Clock } from "lucide-react";
import { SeccionRestringida } from "@/components/seccion-restringida";
import { SinDatos } from "@/components/sin-datos";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requerirUsuarioEnPantalla } from "@/lib/auth";
import { obtenerClaseConInscriptos } from "@/lib/db/clases";
import { aFilaClase } from "@/lib/filaClase";
import { id } from "@/lib/schemas/_common";
import { formatearFecha } from "@/lib/utils";

export const metadata: Metadata = { title: "Inscriptos" };

type Props = { params: Promise<{ id: string }> };

/**
 * Una clase con sus inscriptos: la ve el admin (todas) y el profesor que la
 * dicta. Mismo criterio que /reservas/:id: la clase de otro profesor responde
 * 404 igual que una que no existe, para no confirmar que el id existe.
 *
 * Sin <Suspense>: la consulta va antes de cualquier streaming para que el 404
 * salga con su status (regla de AGENTS.md).
 */
export default async function InscriptosDeClase({ params }: Props) {
  const { id: claseId } = await params;
  const usuario = await requerirUsuarioEnPantalla(`/clases/${claseId}`);
  if (usuario.rol === "SOCIO") return <SeccionRestringida para="el staff del gimnasio" />;

  if (!id.safeParse(claseId).success) notFound();
  // El rol va en el WHERE (lib/db/clases.ts): al profesor, una clase ajena le vuelve null.
  const clase = await obtenerClaseConInscriptos(claseId, usuario);
  if (!clase) notFound();

  const fila = aFilaClase({ ...clase, _count: { reservas: clase.reservas.length } }, usuario.id, usuario.rol === "ADMIN");
  const canceladas = clase._count.reservas;

  return (
    <div>
      <Link href="/" className="text-sm font-medium underline underline-offset-4">
        Volver a las clases
      </Link>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-bold">{fila.nombre}</h1>
          </CardTitle>
          <CardDescription>
            {fila.fecha} · {fila.horario}
          </CardDescription>
          <CardAction>
            <Badge variant={fila.sinCupo ? "destructive" : "secondary"}>
              {fila.sinCupo ? "Sin cupo" : `${fila.ocupados} de ${fila.cupo} lugares`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-muted-foreground">Profesor</dt>
            <dd>{fila.profesor}</dd>
            <dt className="text-muted-foreground">Sala</dt>
            <dd>{fila.sala ?? "Sin asignar"}</dd>
            <dt className="text-muted-foreground">Canceladas</dt>
            <dd className="tabular-nums">{canceladas}</dd>
          </dl>
        </CardContent>
      </Card>

      <section aria-labelledby="titulo-inscriptos" className="mt-8">
        <h2 id="titulo-inscriptos" className="text-lg font-bold">
          Inscriptos ({clase.reservas.length})
        </h2>
        {clase.reservas.length === 0 ? (
          <div className="mt-3">
            <SinDatos titulo="Nadie se anotó todavía" detalle="Cuando un socio reserve esta clase, aparece acá con la fecha en que reservó." />
          </div>
        ) : (
          <ol className="mt-3 divide-y rounded-xl ring-1 ring-foreground/10">
            {clase.reservas.map((reserva) => (
              <li key={reserva.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium break-words">{reserva.socio.nombre}</p>
                  <p className="text-sm break-all text-muted-foreground">{reserva.socio.email}</p>
                  <p className="text-sm text-muted-foreground">Reservó el {formatearFecha(reserva.createdAt)}</p>
                </div>
                {reserva.presente ? (
                  <Badge>
                    <CheckCheck aria-hidden="true" />
                    Asistió
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Clock aria-hidden="true" />
                    Sin asistencia
                  </Badge>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
