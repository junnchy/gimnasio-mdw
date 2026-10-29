"use server";

import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { cancelarReservaPropia } from "@/lib/casos/cancelarReserva";
import { errorFormulario, rechazoFormulario } from "@/lib/formularios";
import { id } from "@/lib/schemas/_common";
import type { EstadoFormulario } from "@/lib/schemas/formulario";

export async function cancelarReservaAction(reservaId: string): Promise<EstadoFormulario> {
  try {
    const socio = await requerirUsuario("SOCIO");
    const validacion = id.safeParse(reservaId);
    if (!validacion.success) return { estado: "ERROR", mensaje: "Reserva no encontrada" };
    const resultado = await cancelarReservaPropia(socio.id, validacion.data);
    if (!resultado.ok) return rechazoFormulario(resultado);
    for (const ruta of ["/", "/clases", "/reservas", `/reservas/${validacion.data}`]) revalidatePath(ruta);
    return { estado: "EXITO", mensaje: "Reserva cancelada. El lugar ya está disponible para otro socio." };
  } catch (error) {
    return errorFormulario(error, "/reservas");
  }
}
