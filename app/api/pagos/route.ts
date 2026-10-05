import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { obtenerMembresiaParaPago } from "@/lib/db/membresias";
import { registrarPago } from "@/lib/db/pagos";
import { puedeRegistrarPago } from "@/lib/pago";
import { crearPreferenciaDePago } from "@/lib/servicios/mercadoPago";
import { pagoSchema } from "@/lib/schemas/pago";
import { requerirUsuario } from "@/lib/auth";
import { responderError } from "@/lib/errores";
import { conflicto, datosInvalidos, noEncontrado, servicioExternoCaido } from "@/lib/http";
import { leerBody } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await requerirUsuario("ADMIN");

    // Ni el `estado` ni la `refExterna` se aceptan del cliente: el estado lo
    // decide el servidor según el medio (spec §8) y la referencia la escribe
    // el webhook con lo que informa Mercado Pago.
    const resultado = pagoSchema.omit({ estado: true, refExterna: true }).safeParse(await leerBody(request));
    if (!resultado.success) return datosInvalidos(resultado.error.flatten());

    const membresia = await obtenerMembresiaParaPago(resultado.data.membresiaId);
    if (!membresia) return noEncontrado("Membresía no encontrada");

    const veredicto = puedeRegistrarPago({ estadoMembresia: membresia.estado });
    if (!veredicto.ok) return conflicto(veredicto);

    // EFECTIVO: el camino manual. No pasa por Mercado Pago.
    if (resultado.data.medio === "EFECTIVO") {
      const { pago, renovada, fechaFin } = await registrarPago(resultado.data, membresia, new Date());
      return NextResponse.json({ pago, membresia: { renovada, fechaFin }, checkoutUrl: null }, { status: 201 });
    }

    // MP: Mercado Pago es ESENCIAL (spec §8). Sin link de cobro no hay pago
    // MP que registrar, así que la preferencia se pide ANTES de tocar la base.
    // El id del pago se genera acá porque viaja como `external_reference`: es
    // lo que el webhook usa después para encontrarlo.
    const id = randomUUID();
    const preferencia = await crearPreferenciaDePago({ id, monto: resultado.data.monto });
    if (!preferencia) {
      return servicioExternoCaido(
        "Mercado Pago no está disponible en este momento. No es un problema de los datos cargados: " +
          "probá de nuevo en unos minutos o registrá el pago en efectivo.",
      );
    }

    const { pago, renovada, fechaFin } = await registrarPago({ ...resultado.data, id }, membresia, new Date());
    return NextResponse.json(
      { pago, membresia: { renovada, fechaFin }, checkoutUrl: preferencia.init_point },
      { status: 201 },
    );
  } catch (error) {
    return responderError("POST /api/pagos", error);
  }
}
