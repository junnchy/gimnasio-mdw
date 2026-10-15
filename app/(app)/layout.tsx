import Link from "next/link";
import { redirect } from "next/navigation";
import { Navegacion } from "@/components/navegacion";
import { obtenerUsuario } from "@/lib/auth";

/**
 * El layout de lo que PIDE SESIÓN (clase 10). El paréntesis no se ve en la
 * URL: la home sigue siendo `/` y el detalle, `/reservas/:id`. Lo que cambia
 * es que ahora comparten una barra que sabe quién sos.
 *
 * ---------------------------------------------------------------------------
 * ESTA REDIRECCIÓN NO ES UNA MEDIDA DE SEGURIDAD
 * ---------------------------------------------------------------------------
 * Evita que alguien sin sesión vea una pantalla vacía y rota: es experiencia
 * de uso. Un layout no se vuelve a ejecutar en cada navegación del lado del
 * cliente, así que cada página de abajo SIGUE verificando la sesión
 * (`requerirUsuarioEnPantalla`) y cada consulta sigue llevando el id de la
 * sesión adentro, como desde la clase 6.
 *
 *   la UI decide qué MOSTRAR;  el servidor decide qué PERMITIR
 *
 * Como esto corre antes de cualquier <Suspense>, sin sesión la respuesta es
 * un 307 de verdad, no una redirección metida en el medio del stream.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await obtenerUsuario();

  if (!usuario) redirect("/ingresar");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 sm:px-6">
      <Navegacion usuario={usuario} />

      {/* Destino del "Saltar al contenido" de la barra. */}
      <main id="contenido" className="flex-1 py-8">
        {children}
      </main>

      <footer className="flex flex-wrap justify-between gap-2 border-t py-4 text-xs text-muted-foreground">
        <span>Pulso · TP de Metodologías y Desarrollos Web, UAI Rosario</span>
        <Link href="/sistema" className="underline-offset-4 hover:text-foreground hover:underline">
          Sistema visual
        </Link>
      </footer>
    </div>
  );
}
