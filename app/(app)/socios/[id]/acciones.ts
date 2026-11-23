"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requerirUsuario } from "@/lib/auth";
import { asignarMembresia } from "@/lib/casos/asignarMembresia";
import { MENSAJE_MP_NO_DISPONIBLE, registrarPago } from "@/lib/casos/registrarPago";
import { errorFormulario, rechazoFormulario } from "@/lib/formularios";
import { asignarMembresiaFormSchema } from "@/lib/schemas/membresia";
import { registrarPagoFormSchema } from "@/lib/schemas/pago";
import type { EstadoFormulario } from "@/lib/schemas/formulario";
import { formatearFecha } from "@/lib/utils";

const texto = (form: FormData, campo: string) => {
  const valor = form.get(campo);
  return typeof valor === "string" ? valor.slice(0, 200) : "";
};

/** Después de escribir: el detalle del socio y el listado, que muestra su estado. */
function revalidarSocio(socioId: string) {
  for (const ruta of ["/socios", `/socios/${socioId}`]) revalidatePath(ruta);
}

/**
 * Asignar un plan (ADMIN). El `socioId` llega en un campo oculto: como todo
 * dato del navegador, se valida, y `crearMembresia` verifica que sea de un
 * SOCIO. El rol del que asigna sale de la sesión.
 */
export async function asignarMembresiaAction(_anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const valores = { socioId: texto(form, "socioId"), planId: texto(form, "planId"), fechaInicio: texto(form, "fechaInicio") };
  let socioId: string;
  try {
    await requerirUsuario("ADMIN");
    const validacion = asignarMembresiaFormSchema.safeParse(valores);
    if (!validacion.success) return { estado: "ERROR", errores: validacion.error.flatten().fieldErrors, valores };
    const resultado = await asignarMembresia(validacion.data);
    if (!resultado.ok) return { ...rechazoFormulario(resultado), valores };
    socioId = validacion.data.socioId;
    revalidarSocio(socioId);
  } catch (error) {
    return { ...errorFormulario(error, "/socios", "administración"), valores };
  }
  // Al asignar, el formulario de alta deja lugar al de cobro: el aviso lo muestra la pantalla.
  redirect(`/socios/${encodeURIComponent(socioId)}?asignado=1`);
}

/**
 * Registrar el pago de una cuota (ADMIN, H7). Mismo caso de uso que
 * `POST /api/pagos`: EFECTIVO renueva al instante; MP devuelve el link de
 * cobro y la membresía se renueva cuando el webhook confirma el pago.
 */
export async function registrarPagoAction(_anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const valores = { membresiaId: texto(form, "membresiaId"), monto: texto(form, "monto"), medio: texto(form, "medio") };
  const socioId = texto(form, "socioId");
  try {
    await requerirUsuario("ADMIN");
    const validacion = registrarPagoFormSchema.safeParse(valores);
    if (!validacion.success) return { estado: "ERROR", errores: validacion.error.flatten().fieldErrors, valores };

    const registro = await registrarPago({ ...validacion.data, fecha: new Date() }, new Date());
    if (!registro.ok) {
      const mensaje = registro.tipo === "NO_ENCONTRADO"
        ? "No encontramos esa membresía. Recargá la página y volvé a intentar."
        : registro.tipo === "CONFLICTO"
          ? registro.veredicto.motivos.map((motivo) => motivo.mensaje).join(" ")
          : MENSAJE_MP_NO_DISPONIBLE;
      return { estado: "ERROR", mensaje, valores };
    }

    // El socioId solo decide qué pantalla se refresca: si viniera mal, se refresca de más, nunca se escribe.
    if (/^[\w-]{1,128}$/.test(socioId)) revalidarSocio(socioId);
    const { renovada, fechaFin, checkoutUrl } = registro.dato;
    if (checkoutUrl) {
      return {
        estado: "EXITO",
        mensaje: "Link de cobro generado. Compartilo con el socio: la membresía se renueva cuando Mercado Pago confirme el pago.",
        enlace: checkoutUrl,
      };
    }
    return {
      estado: "EXITO",
      mensaje: renovada ? `Pago registrado. La membresía ahora vence el ${formatearFecha(fechaFin)}.` : "Pago registrado.",
    };
  } catch (error) {
    return { ...errorFormulario(error, "/socios", "administración"), valores };
  }
}
