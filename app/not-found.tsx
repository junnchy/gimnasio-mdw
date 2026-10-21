import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

/**
 * El 404 de una dirección que no existe en ninguna parte del sistema (clase
 * 10). Sin este archivo, Next.js muestra su página por defecto, en inglés y
 * sin la marca. Está fuera de los grupos de ruta, así que no sabe si hay
 * sesión: ofrece volver al inicio, que manda al login si hace falta.
 */
export default function NoExiste() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Logo className="h-9 w-auto self-start" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="mt-1 text-2xl font-bold">Esta página no existe</h1>
        <p className="mt-2 text-muted-foreground">Revisá la dirección o volvé al inicio.</p>
      </div>
      <Link href="/" className={buttonVariants({ className: "self-start" })}>
        Ir al inicio
      </Link>
    </main>
  );
}
