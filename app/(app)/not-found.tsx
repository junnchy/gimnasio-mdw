import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * El 404 de las pantallas con sesión, dibujado CON la barra (clase 10): quien
 * llegó por un enlace viejo sigue dentro del sistema y tiene a dónde ir.
 *
 * Mismo criterio que la API desde la clase 6: "no existe" y "no es tuya"
 * terminan acá con el mismo texto. Por eso no dice "permiso": decirlo ya es
 * confirmar que el registro existe.
 */
export default function NoEncontrado() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="mt-1 text-2xl font-bold">No encontramos esta página</h1>
      </div>
      <p className="max-w-prose text-muted-foreground">
        Puede que el enlace esté mal copiado o que no sea parte de lo que te corresponde ver.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Volver al inicio
      </Link>
    </div>
  );
}
