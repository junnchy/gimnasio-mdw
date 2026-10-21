import { EnlaceNavegacion } from "@/components/enlace-navegacion";
import { EnlaceLogo } from "@/components/enlace-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut, type UsuarioSesion } from "@/lib/auth";
import { NOMBRE_ROL } from "@/lib/etiquetas";

/**
 * La barra de las pantallas con sesión (clase 10). Contesta las tres
 * preguntas de quien entra a un sistema que no conoce:
 *
 *   ¿dónde estoy?    el logo lleva al inicio y la sección actual se marca
 *   ¿quién soy acá?  el nombre y EL ROL, que explica por qué ve lo que ve
 *   ¿cómo me voy?    "Salir", siempre en el mismo lugar
 *
 * El rol es un cartel, no un permiso: qué datos se ven lo decide `lib/db/`
 * con el rol de la sesión. Los enlaces que se esconden según el rol son
 * cortesía; la pantalla igual verifica.
 *
 * Es un Server Component: "Salir" es un formulario con una Server Action, no
 * un onClick. Solo `EnlaceNavegacion` va al navegador.
 */
export function Navegacion({ usuario }: { usuario: UsuarioSesion }) {
  return (
    <header className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b py-4">
      {/*
        Primero en el DOM y visible solo con el foco: quien navega con teclado
        salta el menú en cada pantalla en vez de recorrerlo entero.
      */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-0 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <EnlaceLogo />

        <nav aria-label="Secciones">
          <ul className="flex gap-1">
            <li>
              <EnlaceNavegacion href="/">Inicio</EnlaceNavegacion>
            </li>
            {usuario.rol === "SOCIO" ? (
              <li>
                <EnlaceNavegacion href="/reservas">Mis reservas</EnlaceNavegacion>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 text-right">
          <p className="max-w-48 truncate text-sm font-medium">{usuario.nombre}</p>
          <Badge variant="secondary">{NOMBRE_ROL[usuario.rol]}</Badge>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/ingresar" });
          }}
        >
          <Button type="submit" variant="outline">
            Salir
          </Button>
        </form>
      </div>
    </header>
  );
}
