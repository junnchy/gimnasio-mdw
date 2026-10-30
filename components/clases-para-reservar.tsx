import { ReservarClase } from "@/components/reservar-clase";
import { SinDatos } from "@/components/sin-datos";
import { listarProximasClases } from "@/lib/db/clases";
import { aFilaClase } from "@/lib/filaClase";

export async function ClasesParaReservar({ socioId }: { socioId: string }) {
  const clases = await listarProximasClases(new Date(), 50);
  if (!clases.length) return <SinDatos titulo="Todavía no hay clases próximas" detalle="Cuando el gimnasio programe una clase, vas a poder reservarla acá. Consultá los horarios en recepción." />;
  return <ReservarClase clases={clases.map((clase) => aFilaClase(clase, socioId))} />;
}
