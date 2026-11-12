/**
 * El punto de partida de la socia del flujo principal: afuera del gimnasio y
 * con la cuota al día, así su primer escaneo es un ingreso.
 *
 * Lo usan `preparar.ts` (una vez, antes de todo) y la prueba del flujo antes
 * de CADA intento: en CI una prueba que falla se reintenta, y si el primer
 * intento llegó a registrar el ingreso, el segundo arrancaría con la visita
 * abierta y su primer escaneo sería una salida.
 */
import { EstadoMembresia, type PrismaClient } from "@prisma/client";
import { exigirBaseLocal } from "./base-local";
import { PERSONAS } from "./sesiones";

const DIA = 86_400_000;

export async function reiniciarSocia(prisma: PrismaClient): Promise<void> {
  // Borra datos: otra vez el cinturón, aunque la config ya lo haya chequeado.
  exigirBaseLocal();

  const socia = await prisma.user.findUniqueOrThrow({ where: { email: PERSONAS.socio.email } });
  const plan = await prisma.plan.findUniqueOrThrow({ where: { nombre: "Mensual" } });
  const hoy = new Date();

  await prisma.visita.deleteMany({ where: { socioId: socia.id } });
  await prisma.membresia.deleteMany({ where: { socioId: socia.id } });
  await prisma.membresia.create({
    data: {
      socioId: socia.id,
      planId: plan.id,
      fechaInicio: hoy,
      fechaFin: new Date(hoy.getTime() + 30 * DIA),
      estado: EstadoMembresia.ACTIVA,
    },
  });
}
