import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { EstadoFormulario as Estado } from "@/lib/schemas/formulario";

export function EstadoFormulario({ estado }: { estado: Estado }) {
  if (!estado.mensaje) return null;
  return (
    <Alert variant={estado.estado === "ERROR" ? "destructive" : "default"} role={estado.estado === "ERROR" ? "alert" : "status"}>
      <AlertTitle>{estado.estado === "ERROR" ? "No pudimos completar la operación" : estado.mensaje}</AlertTitle>
      <AlertDescription>
        {estado.estado === "ERROR" ? estado.mensaje : null}
        {estado.enlace ? (
          <p className="mt-2 break-all">
            <a href={estado.enlace} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
              Abrir el link de cobro
            </a>
            <span className="mt-1 block text-sm text-muted-foreground">{estado.enlace}</span>
          </p>
        ) : null}
        {estado.resultado ? <p>A las {estado.resultado.hora}{estado.resultado.duracionMin !== null ? ` · Estuviste ${estado.resultado.duracionMin} minutos.` : " · ¡Buen entrenamiento!"}</p> : null}
      </AlertDescription>
    </Alert>
  );
}
