import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Lo que ve alguien con sesión en una pantalla de otro rol: el 403 de la API
 * traducido para una persona (como `SoloSocios`, para las de staff). No es la
 * medida de seguridad: la pantalla igual no consulta nada si el rol no
 * alcanza, y las consultas de inscriptos llevan el rol en el WHERE.
 */
export function SeccionRestringida({ para }: { para: "administración" | "el staff del gimnasio" }) {
  return (
    <Alert>
      <AlertTitle>Esta sección es para {para}</AlertTitle>
      <AlertDescription>
        Tu cuenta tiene otro rol. <Link href="/">Volvé al inicio</Link>.
      </AlertDescription>
    </Alert>
  );
}
