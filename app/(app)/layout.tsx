import { Navegacion } from "@/components/navegacion";
import { PieDePagina } from "@/components/pie-de-pagina";
import { obtenerUsuario } from "@/lib/auth";

/**
 * El layout de lo que PIDE SESIÓN (clase 10). El paréntesis no se ve en la
 * URL: la home sigue siendo `/` y el detalle, `/reservas/:id`. Lo que cambia
 * es que ahora comparten una barra que sabe quién sos.
 *
 * ---------------------------------------------------------------------------
 * ACÁ NO SE VERIFICA LA SESIÓN, Y ES A PROPÓSITO
 * ---------------------------------------------------------------------------
 * Un layout no es un lugar confiable para autorizar: no se vuelve a ejecutar
 * en cada navegación del cliente, y Next.js renderiza layout y página en
 * paralelo. La verificación vive en CADA página (`requerirUsuarioEnPantalla`),
 * y cada consulta sigue llevando el id de la sesión adentro, como desde la
 * clase 6.
 *
 *   la UI decide qué MOSTRAR;  el servidor decide qué PERMITIR
 *
 * Tampoco redirige al login: el layout no sabe en qué dirección está, así que
 * su redirección perdería el `callbackUrl` y quien abrió un link a una
 * reserva terminaría en el inicio después de entrar. La página sí lo sabe:
 * redirige a `/ingresar?callbackUrl=<su ruta>` con un 307 real, porque lo hace
 * antes de cualquier <Suspense>.
 *
 * Sin sesión, entonces, el layout no dibuja la barra (no hay a quién
 * mostrarle "Salir") y deja que la página redirija.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await obtenerUsuario();

  if (!usuario) return children;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 sm:px-6">
      <Navegacion usuario={usuario} />

      {/* Destino del "Saltar al contenido" de la barra. */}
      <main id="contenido" className="flex-1 py-8">
        {children}
      </main>

      <PieDePagina />
    </div>
  );
}
