import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Lo que ve un PROFESOR o ADMIN en una pantalla de socios. Es el 403 de la
 * API traducido para una persona: la ruta existe, lo que falta es el rol.
 * No es una medida de seguridad: la consulta igual lleva el id de la sesión.
 */
export function SoloSocios() {
  return (
    <Alert>
      <AlertTitle>Esta sección es para socios</AlertTitle>
      <AlertDescription>
        Tu cuenta tiene otro rol. <Link href="/">Volvé al inicio</Link>.
      </AlertDescription>
    </Alert>
  );
}
