/**
 * DIEZ PEDIDOS A LA VEZ (clase 14).
 *
 * Todas las otras pruebas hacen una cosa por vez, como una persona. Esta hace
 * lo que pasa en producción y nunca en una demo: el mismo pedido, diez veces,
 * al mismo tiempo. El doble clic, dos pestañas, el celular que reintenta solo,
 * o diez socios que quieren el último lugar del Spinning.
 *
 * Las reglas son de `docs/spec.md` §6:
 *   - "El cupo de una clase nunca puede quedar negativo".
 *   - Un socio no reserva dos veces la misma clase (índice único parcial
 *     `Reserva_socio_clase_confirmada_key`).
 *
 * Las hace cumplir la base, no un `if`: la reserva corre en una transacción
 * SERIALIZABLE (`lib/db/operacionSocio.ts`) y el duplicado lo frena el índice.
 * El que pierde recibe 409, el mismo que si hubiera llegado solo; un 500 sería
 * otra forma de fallar aunque la regla se cumpla.
 *
 * Los pedidos van por la API (`POST /api/reservas`), cada uno con la cookie de
 * su socio: es lo mismo que hace la pantalla `/clases`, sin el navegador.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { PrismaClient, type Clase, type User } from "@prisma/client";
import { headerDeSesion } from "./sesion";

const PEDIDOS_A_LA_VEZ = 10;
const DIA = 86_400_000;
const PREFIJO = "e2e-concurrencia";

// Fuera de la app: las pruebas preparan y cuentan directo en la base local.
const prisma = new PrismaClient();
let socios: User[] = [];
let profesorId = "";

test.beforeAll(async () => {
  profesorId = (await prisma.user.findUniqueOrThrow({ where: { email: "profe@ejemplo.com" } })).id;
  const plan = await prisma.plan.upsert({
    where: { nombre: "Plan e2e" },
    update: {},
    create: { nombre: "Plan e2e", precio: 1000, duracionDias: 30 },
  });

  // Diez socios al día con la cuota: lo único que puede rechazarlos es la regla.
  socios = [];
  for (let i = 0; i < PEDIDOS_A_LA_VEZ; i++) {
    const email = `${PREFIJO}-${i}@ejemplo.com`;
    const socio = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, nombre: `Socio concurrente ${i}`, rol: "SOCIO" },
    });
    const vigente = await prisma.membresia.findFirst({ where: { socioId: socio.id, fechaFin: { gt: new Date(Date.now() + DIA) } } });
    if (!vigente) {
      await prisma.membresia.create({
        data: { socioId: socio.id, planId: plan.id, fechaInicio: new Date(), fechaFin: new Date(Date.now() + 30 * DIA), estado: "ACTIVA" },
      });
    }
    socios.push(socio);
  }
});

// Cada prueba (y cada reintento del CI) arranca sin reservas de estos socios,
// así ninguna choca por horario con lo que dejó la anterior.
test.beforeEach(async () => {
  await prisma.reserva.deleteMany({ where: { socio: { email: { startsWith: PREFIJO } } } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

/** Una clase nueva, en un horario libre, para que nada la comparta con otra prueba. */
async function claseNueva(cupoMaximo: number, diasAdelante: number): Promise<Clase> {
  return prisma.clase.create({
    data: {
      nombre: `Clase e2e ${Date.now()}`,
      profesorId,
      cupoMaximo,
      inicio: new Date(Date.now() + diasAdelante * DIA),
      duracionMin: 45,
      sala: "Sala e2e",
    },
  });
}

/** Un pedido de reserva con la sesión de `socio`. */
async function reservar(request: APIRequestContext, socio: User, claseId: string) {
  return request.post("/api/reservas", { data: { claseId }, headers: await headerDeSesion(socio) });
}

test(`${PEDIDOS_A_LA_VEZ} socios por el último lugar: entra uno solo`, async ({ request }) => {
  const clase = await claseNueva(1, 3);

  // `Promise.all` y no un `for` con `await`: salen todos juntos, sin esperar
  // la respuesta del anterior. Diez personas empujando la misma puerta.
  const respuestas = await Promise.all(socios.map((socio) => reservar(request, socio, clase.id)));
  const status = respuestas.map((r) => r.status()).sort((a, b) => a - b);

  expect(status).toEqual([201, ...Array(PEDIDOS_A_LA_VEZ - 1).fill(409)]);

  // Lo que importa no es la respuesta sino lo que quedó en la base.
  const confirmadas = await prisma.reserva.count({ where: { claseId: clase.id, estado: "CONFIRMADA" } });
  expect(confirmadas).toBe(1);
});

test(`el mismo socio, ${PEDIDOS_A_LA_VEZ} veces la misma reserva: queda una`, async ({ request }) => {
  const clase = await claseNueva(20, 4);
  const [socio] = socios;
  if (!socio) throw new Error("beforeAll no creó los socios");

  const respuestas = await Promise.all(
    Array.from({ length: PEDIDOS_A_LA_VEZ }, () => reservar(request, socio, clase.id)),
  );
  const status = respuestas.map((r) => r.status()).sort((a, b) => a - b);

  expect(status).toEqual([201, ...Array(PEDIDOS_A_LA_VEZ - 1).fill(409)]);

  const confirmadas = await prisma.reserva.count({ where: { claseId: clase.id, socioId: socio.id, estado: "CONFIRMADA" } });
  expect(confirmadas).toBe(1);
});
