"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { reservarClase } from "@/lib/casos/reservarClase";
import { errorFormulario, rechazoFormulario } from "@/lib/formularios";
import { reservaSchema } from "@/lib/schemas/reserva";
import type { EstadoFormulario } from "@/lib/schemas/formulario";

export async function reservarClaseAction(_anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  let destino: string;
  let valores: EstadoFormulario["valores"];
  try {
    const socio = await requerirUsuario("SOCIO");
    const claseId = form.get("claseId");
    valores = { claseId: typeof claseId === "string" ? claseId.slice(0, 128) : "" };
    const validacion = reservaSchema.pick({ claseId: true }).safeParse({ claseId });
    if (!validacion.success) return { estado: "ERROR", errores: validacion.error.flatten().fieldErrors, valores };
    const resultado = await reservarClase(socio.id, validacion.data.claseId);
    if (!resultado.ok) return { ...rechazoFormulario(resultado), valores };
    destino = `/reservas/${resultado.dato.id}`;
    for (const ruta of ["/", "/clases", "/reservas", destino]) revalidatePath(ruta);
  } catch (error) {
    return { ...errorFormulario(error, "/clases"), valores };
  }
  redirect(destino);
}
