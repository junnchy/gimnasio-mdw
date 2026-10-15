"use client";

/**
 * Un enlace de la barra que sabe si es la sección donde estás (clase 10).
 *
 * Por qué es de cliente: la dirección actual (`usePathname`) es una API del
 * navegador, y el layout que dibuja la barra no se vuelve a ejecutar al
 * navegar entre pantallas. Es chico a propósito: el resto de la barra
 * (nombre, rol, "Salir") sigue siendo de servidor.
 *
 * La sección actual se marca con `aria-current="page"`, que lee el lector de
 * pantalla, y con un fondo, no solo con el color del texto.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function EnlaceNavegacion({ href, children }: { href: string; children: React.ReactNode }) {
  const ruta = usePathname();
  const activo = href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        activo ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
