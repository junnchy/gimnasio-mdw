import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { EstadoFormulario as Estado } from "@/lib/schemas/formulario";

export function EstadoFormulario({ estado }: { estado: Estado }) {
  if (!estado.mensaje) return null;
  return (
    <Alert variant={estado.estado === "ERROR" ? "destructive" : "default"} role={estado.estado === "ERROR" ? "alert" : "status"}>
      <AlertTitle>{estado.estado === "ERROR" ? "No pudimos completar la operación" : estado.mensaje}</AlertTitle>
      <AlertDescription>
        {estado.estado === "ERROR" ? estado.mensaje : null}
        {estado.resultado ? <p>A las {estado.resultado.hora}{estado.resultado.duracionMin !== null ? ` · Estuviste ${estado.resultado.duracionMin} minutos.` : " · ¡Buen entrenamiento!"}</p> : null}
      </AlertDescription>
    </Alert>
  );
}
