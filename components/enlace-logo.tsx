import Link from "next/link";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

/**
 * El logo como enlace al inicio, con su anillo de foco (clase 10). Lo usan la
 * barra de navegación y el layout público: así el radio y el foco se escriben
 * una sola vez, acá, y no a mano en `app/`.
 */
export function EnlaceLogo({ className, tamanio = "h-7" }: { className?: string; tamanio?: "h-7" | "h-9" }) {
  return (
    <Link
      href="/"
      aria-label="Pulso, ir al inicio"
      className={cn("rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}
    >
      <Logo className={cn(tamanio, "w-auto")} />
    </Link>
  );
}
