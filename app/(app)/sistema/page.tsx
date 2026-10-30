import { EstadoFormulario } from "@/components/estado-formulario";
import type { Metadata } from "next";
import Link from "next/link";
import { EsqueletoReservas } from "@/components/esqueleto-reservas";
import { FiltroReservas } from "@/components/filtro-reservas";
import { InsigniaMembresia } from "@/components/insignia-membresia";
import { InsigniaReserva } from "@/components/insignia-reserva";
import { Logo } from "@/components/logo";
import { SinDatos } from "@/components/sin-datos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requerirUsuarioEnPantalla } from "@/lib/auth";
import type { FilaReserva } from "@/lib/filaReserva";

export const metadata: Metadata = { title: "Sistema visual" };

const TEXTO_LARGO =
  "Entrenamiento funcional de alta intensidad con circuito de fuerza, movilidad y trabajo cardiovascular para todos los niveles";

// Datos de muestra: ninguna fila sale de la base. Todas están CONFIRMADAS a
// propósito, para que "Canceladas" muestre el estado "sin resultados".
const FILAS_DE_MUESTRA: FilaReserva[] = [
  { id: "muestra-1", clase: "Spinning", fecha: "martes, 13 de octubre", horario: "18:00 a 19:00", sala: "Principal", estado: "CONFIRMADA", presente: true },
  { id: "muestra-2", clase: TEXTO_LARGO, fecha: "miércoles, 14 de octubre", horario: "07:00 a 07:45", sala: "Sala 2", estado: "CONFIRMADA", presente: false },
];

/**
 * /sistema, la galería de componentes (clase 10, mapa de pantallas).
 *
 * Cada componente con todos sus estados, con los mismos tokens que las
 * pantallas reales. Sirve para revisar de una vez contraste y foco, y para
 * ver los casos que en la base no se pueden producir sin ensuciarla: una
 * membresía VENCIDA, una clase sin cupo, un nombre larguísimo.
 *
 * Es una herramienta interna del equipo, pero va en (app): también pide sesión.
 * No está enlazada en la interfaz: se abre escribiendo /sistema.
 * Los enlaces de las filas de muestra llevan a un 404, como corresponde.
 */
export default async function Sistema() {
  await requerirUsuarioEnPantalla("/sistema");

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold">Sistema visual</h1>
        <p className="mt-1 text-muted-foreground">
          Los componentes de Pulso con todos sus estados. Las reglas están en <code>docs/marca/</code>.
        </p>
      </div>

      <section aria-labelledby="s-marca" className="space-y-4">
        <h2 id="s-marca" className="text-lg font-bold">Marca</h2>
        <div className="flex flex-wrap items-center gap-6">
          <Logo className="h-10 w-auto" />
          <Logo variante="isotipo" className="size-10" />
          <Logo variante="isotipo" className="size-6" />
        </div>
      </section>

      <section aria-labelledby="s-botones" className="space-y-4">
        <h2 id="s-botones" className="text-lg font-bold">Botones</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Principal</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Destructivo</Button>
          <Button variant="link">Enlace</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Chico</Button>
          <Button>Normal</Button>
          <Button size="lg">Grande</Button>
          <Button disabled>Deshabilitado</Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Enlace con forma de botón
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">Recorré esta fila con Tab: cada botón muestra el anillo de foco.</p>
      </section>

      <section aria-labelledby="s-insignias" className="space-y-4">
        <h2 id="s-insignias" className="text-lg font-bold">Insignias</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Principal</Badge>
          <Badge variant="secondary">Secundaria</Badge>
          <Badge variant="outline">Contorno</Badge>
          <Badge variant="destructive">Destructiva</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Reserva</p>
          <div className="flex flex-wrap gap-3">
            <InsigniaReserva estado="CONFIRMADA" presente={false} />
            <InsigniaReserva estado="CONFIRMADA" presente />
            <InsigniaReserva estado="CANCELADA" presente={false} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Membresía</p>
          <div className="flex flex-wrap gap-2">
            <InsigniaMembresia estado="ACTIVA" />
            <InsigniaMembresia estado="VENCIDA" />
            <InsigniaMembresia estado="CANCELADA" />
            <InsigniaMembresia estado={null} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Cada estado lleva ícono y palabra, no solo color (spec §7).</p>
      </section>

      <section aria-labelledby="s-tarjetas" className="space-y-4">
        <h2 id="s-tarjetas" className="text-lg font-bold">Tarjetas</h2>
        <Card>
          <CardHeader>
            <CardTitle>Tu membresía</CardTitle>
            <CardAction>
              <InsigniaMembresia estado="VENCIDA" />
            </CardAction>
            <CardDescription>
              Plan Libre · Venció el lunes, 12 de octubre. Renovala en recepción para volver a entrar y reservar clases.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="break-words">{TEXTO_LARGO}</CardTitle>
            <CardDescription>Un título muy largo tiene que cortar en varias líneas sin romper la tarjeta.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm break-words">{TEXTO_LARGO.repeat(2)}</CardContent>
        </Card>
      </section>

      <section aria-labelledby="s-campos" className="space-y-4">
        <h2 id="s-campos" className="text-lg font-bold">Campos de texto</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="campo-normal" className="text-sm font-medium">Nombre del plan</label>
            <Input id="campo-normal" placeholder="Plan Libre" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="campo-error" className="text-sm font-medium">Precio</label>
            <Input id="campo-error" defaultValue="-100" aria-invalid="true" aria-describedby="campo-error-ayuda" />
            <p id="campo-error-ayuda" className="text-sm text-destructive">
              Ingresá un precio mayor a cero.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="campo-deshabilitado" className="text-sm font-medium">Duración</label>
            <Input id="campo-deshabilitado" defaultValue="30 días" disabled />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Cada campo tiene su <code>label</code>; el error se dice con texto, además del borde rojo.
        </p>
      </section>

      <section aria-labelledby="s-alertas" className="space-y-4">
        <h2 id="s-alertas" className="text-lg font-bold">Avisos</h2>
        <Alert>
          <AlertTitle>Esta sección es para socios</AlertTitle>
          <AlertDescription>
            Tu cuenta tiene otro rol. <Link href="/">Volvé al inicio</Link>.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar esta pantalla</AlertTitle>
          <AlertDescription>
            <p>El problema es del sistema, no de lo que hiciste, y no se perdió ningún dato. Probá de nuevo; si sigue igual, avisá en recepción.</p>
            <p className="text-xs">Así se ve el estado de error (app/(app)/error.tsx), que además ofrece «Reintentar».</p>
          </AlertDescription>
        </Alert>
      </section>

      <section aria-labelledby="s-formularios" className="space-y-4">
        <h2 id="s-formularios" className="text-lg font-bold">Formularios</h2>
        <EstadoFormulario estado={{ estado: "ERROR", mensaje: "Sin cupo disponible. Elegí otra clase." }} />
        <EstadoFormulario estado={{ estado: "EXITO", mensaje: "Salida registrada", resultado: { hora: "18:30", duracionMin: 60 } }} />
        <div className="space-y-2"><label htmlFor="form-ejemplo">Elegí una clase</label><select id="form-ejemplo" aria-invalid="true" aria-describedby="form-ejemplo-error" className="block min-h-12 w-full rounded-lg border border-input bg-background px-3"><option>Seleccioná una clase</option></select><p id="form-ejemplo-error" className="text-destructive">Elegí una clase para continuar.</p></div>
        <Button disabled className="min-h-12">Reservando…</Button>
      </section>

      <section aria-labelledby="s-estados" className="space-y-8">
        <h2 id="s-estados" className="text-lg font-bold">Los estados de una lista</h2>

        <div>
          <h3 className="font-bold">Cargando</h3>
          <EsqueletoReservas />
        </div>

        <div className="space-y-4">
          <h3 className="font-bold">Vacío</h3>
          <SinDatos
            titulo="Todavía no tenés reservas"
            detalle="Cuando reserves una clase, la vas a ver acá con su horario y su estado."
          />
        </div>

        <div>
          <h3 className="font-bold">Con datos, texto largo y sin resultados</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Elegí «Canceladas» para ver el estado sin resultados: no es el mismo texto que el vacío.
          </p>
          <FiltroReservas reservas={FILAS_DE_MUESTRA} />
        </div>
      </section>
    </div>
  );
}
