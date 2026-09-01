import { NextResponse } from "next/server";
import { crearRutina } from "@/lib/db/rutinas";
import { rutinaSchema } from "@/lib/schemas/rutina";
import { usuarioDeEjemplo } from "@/lib/usuarioDeEjemplo";

export async function POST(request: Request) {
  const resultado = rutinaSchema.omit({ profesorId: true }).safeParse(await request.json() as unknown);
  if (!resultado.success) return NextResponse.json({ error: "Datos inválidos", detalles: resultado.error.flatten() }, { status: 400 });
  // TODO (clase 6): profesorId y rol PROFESOR salen de sesión.
  const rutina = await crearRutina(resultado.data, await usuarioDeEjemplo("PROFESOR"));
  return rutina ? NextResponse.json(rutina, { status: 201 }) : NextResponse.json({ error: "Socio no encontrado" }, { status: 404 });
}
