"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { programarClase } from "@/lib/casos/programarClase";
import { errorFormulario } from "@/lib/formularios";
import { programarClaseFormSchema } from "@/lib/schemas/clase";
import type { EstadoFormulario } from "@/lib/schemas/formulario";

const CAMPOS = ["nombre", "cupoMaximo", "inicio", "duracionMin", "sala"] as const;

/** Lo escrito, para devolverlo si algo falla: el formulario no pierde los valores. */
function leerValores(form: FormData): Record<string, string> {
  return Object.fromEntries(CAMPOS.map((campo) => {
    const valor = form.get(campo);
    return [campo, typeof valor === "string" ? valor.slice(0, 100) : ""];
  }));
}

/**
 * Programar una clase desde /clases/nueva (PROFESOR). Mismo caso de uso que
 * `POST /api/clases`: la clase queda a nombre del profesor de la SESIÓN.
 */
export async function programarClaseAction(_anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  let destino: string;
  const valores = leerValores(form);
  try {
    const profesor = await requerirUsuario("PROFESOR");
    const validacion = programarClaseFormSchema.safeParse(valores);
    if (!validacion.success) return { estado: "ERROR", errores: validacion.error.flatten().fieldErrors, valores };
    const clase = await programarClase(profesor.id, validacion.data);
    destino = `/clases/${clase.id}`;
    // El inicio de profesor y admin lista las próximas clases; /clases, las que el socio puede reservar.
    for (const ruta of ["/", "/clases", destino]) revalidatePath(ruta);
  } catch (error) {
    return { ...errorFormulario(error, "/clases/nueva", "profesores"), valores };
  }
  redirect(destino);
}
