"use server";

import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { registrarEscaneo } from "@/lib/casos/registrarEscaneo";
import { errorFormulario, rechazoFormulario } from "@/lib/formularios";
import { registrarEscaneoSchema } from "@/lib/schemas/escaneo";
import type { EstadoFormulario } from "@/lib/schemas/formulario";
import { formatearHora } from "@/lib/utils";

export async function registrarEscaneoAction(_anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  try {
    const socio = await requerirUsuario("SOCIO");
    const validacion = registrarEscaneoSchema.pick({ qrToken: true }).safeParse({ qrToken: form.get("qrToken") });
    if (!validacion.success) return { estado: "ERROR", errores: validacion.error.flatten().fieldErrors };
    const resultado = await registrarEscaneo(socio.id, validacion.data.qrToken);
    if (!resultado.ok) return rechazoFormulario(resultado);
    const visita = resultado.dato;
    revalidatePath("/");
    revalidatePath("/escanear");
    return {
      estado: "EXITO", mensaje: visita.estado === "ABIERTA" ? "Ingreso registrado" : "Salida registrada",
      resultado: { hora: formatearHora(visita.egresoAt ?? visita.ingresoAt), duracionMin: visita.duracionMin },
    };
  } catch (error) {
    return errorFormulario(error, "/escanear");
  }
}
