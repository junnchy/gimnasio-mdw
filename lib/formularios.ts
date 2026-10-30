import { redirect } from "next/navigation";
import { NoAutenticado, NoAutorizado } from "@/lib/errores";
import type { Rechazo } from "@/lib/casos/resultado";
import type { EstadoFormulario } from "@/lib/schemas/formulario";

export function rechazoFormulario(resultado: Rechazo): EstadoFormulario {
  return { estado: "ERROR", mensaje: resultado.tipo === "NO_ENCONTRADO"
    ? resultado.mensaje : resultado.motivos.map((motivo) => motivo.mensaje).join(" ") };
}

export function errorFormulario(error: unknown, ruta: string): EstadoFormulario {
  if (error instanceof NoAutenticado) redirect(`/ingresar?callbackUrl=${encodeURIComponent(ruta)}`);
  if (error instanceof NoAutorizado) return { estado: "ERROR", mensaje: "Esta operación es para socios. Volvé al inicio." };
  console.error(`Formulario ${ruta}`, error);
  // No afirmar que no se guardó: una conexión puede perderse DESPUÉS del commit.
  return { estado: "ERROR", mensaje: "No pudimos confirmar el resultado. Revisá el estado antes de volver a intentar." };
}
