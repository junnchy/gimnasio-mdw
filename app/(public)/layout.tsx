import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * El layout de lo PÚBLICO: las pantallas que funcionan sin sesión (clase 10).
 *
 * Hoy es una sola, /ingresar, y el mapa de pantallas (spec §5) la marca como
 * la única fila "sin sesión". El paréntesis de `(public)` no aparece en la
 * URL: el grupo existe para tener un layout propio, no una dirección nueva.
 *
 * El envoltorio es casi nada a propósito: sin barra de navegación, sin nombre
 * de usuario, sin "Salir". Mostrarle el menú del sistema a alguien que todavía
 * no entró es ofrecerle lugares a los que no puede ir.
 */
export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
      <header>
        <Link
          href="/"
          className="inline-block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo className="h-9 w-auto" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">{children}</main>

      <footer className="text-xs text-muted-foreground">
        Pulso · TP de Metodologías y Desarrollos Web, UAI Rosario
      </footer>
    </div>
  );
}
