/**
 * Datos de ejemplo para desarrollo.
 *
 * Correr con: npm run db:seed
 *
 * Por qué existe: para que los cuatro integrantes del equipo trabajen contra
 * los mismos datos y para poder mostrar el sistema sin cargar todo a mano.
 * Debe poder correrse varias veces sin romper: `upsert` donde hay clave única
 * (email de User, nombre de Plan) y `findFirst` + `create` en el resto.
 */
import { PrismaClient, Rol, EstadoMembresia, EstadoVisita } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@ejemplo.com" },
    update: {},
    create: { email: "admin@ejemplo.com", nombre: "Admin", rol: Rol.ADMIN },
  });

  const profe = await prisma.user.upsert({
    where: { email: "profe@ejemplo.com" },
    update: {},
    create: { email: "profe@ejemplo.com", nombre: "Profe", rol: Rol.PROFESOR },
  });

  const socio = await prisma.user.upsert({
    where: { email: "socio@ejemplo.com" },
    update: {},
    create: { email: "socio@ejemplo.com", nombre: "Socio", rol: Rol.SOCIO },
  });

  // Socios para probar los caminos de error: el profe pide que el seed deje
  // recorrer el flujo principal COMPLETO, incluidos los rechazos.
  const socioVencido = await prisma.user.upsert({
    where: { email: "socio-vencido@ejemplo.com" },
    update: {},
    create: { email: "socio-vencido@ejemplo.com", nombre: "Socio Vencido", rol: Rol.SOCIO },
  });

  const plan = await prisma.plan.upsert({
    where: { nombre: "Mensual" },
    update: {},
    create: { nombre: "Mensual", descripcion: "Acceso ilimitado", precio: 30000, duracionDias: 30 },
  });

  const hoy = new Date();
  const membresia = await prisma.membresia.findFirst({
    where: { socioId: socio.id },
  });

  if (!membresia) {
    await prisma.membresia.create({
      data: {
        socioId: socio.id,
        planId: plan.id,
        fechaInicio: hoy,
        fechaFin: new Date(hoy.getTime() + 30 * 86400000),
        estado: EstadoMembresia.ACTIVA,
      },
    });
  }

  // Membresía cuyo vencimiento ya pasó: al leer, se calcula VENCIDA (H1/H4
  // tienen que rechazar a este socio). VENCIDA no se guarda en la base.
  const membresiaVencida = await prisma.membresia.findFirst({
    where: { socioId: socioVencido.id },
  });

  if (!membresiaVencida) {
    await prisma.membresia.create({
      data: {
        socioId: socioVencido.id,
        planId: plan.id,
        fechaInicio: new Date(hoy.getTime() - 60 * 86400000),
        fechaFin: new Date(hoy.getTime() - 30 * 86400000),
        estado: EstadoMembresia.ACTIVA,
      },
    });
  }

  let press = await prisma.ejercicio.findFirst({ where: { nombre: "Press de banca" } });
  if (!press) {
    press = await prisma.ejercicio.create({
      data: { nombre: "Press de banca", grupoMuscular: "Pecho" },
    });
  }

  let sentadilla = await prisma.ejercicio.findFirst({ where: { nombre: "Sentadilla" } });
  if (!sentadilla) {
    sentadilla = await prisma.ejercicio.create({
      data: { nombre: "Sentadilla", grupoMuscular: "Piernas" },
    });
  }

  const rutina = await prisma.rutina.findFirst({
    where: { socioId: socio.id },
  });

  if (!rutina) {
    const nueva = await prisma.rutina.create({
      data: {
        nombre: "Full body",
        profesorId: profe.id,
        socioId: socio.id,
      },
    });
    await prisma.rutinaEjercicio.createMany({
      data: [
        { rutinaId: nueva.id, ejercicioId: press.id, series: 4, repeticiones: 10, descansoSeg: 90, orden: 1 },
        { rutinaId: nueva.id, ejercicioId: sentadilla.id, series: 4, repeticiones: 12, descansoSeg: 120, orden: 2 },
      ],
    });
  }

  const clase = await prisma.clase.findFirst();
  if (!clase) {
    await prisma.clase.create({
      data: {
        nombre: "Spinning",
        profesorId: profe.id,
        cupoMaximo: 20,
        inicio: new Date(hoy.getTime() + 86400000),
        duracionMin: 60,
        sala: "Principal",
      },
    });
  }

  // Clase llena: cupo 1 y una reserva confirmada encima. Sirve para probar
  // el rechazo "sin cupo disponible" de la H4.
  const claseLlena = await prisma.clase.findFirst({ where: { nombre: "Funcional" } });
  if (!claseLlena) {
    const creada = await prisma.clase.create({
      data: {
        nombre: "Funcional",
        profesorId: profe.id,
        cupoMaximo: 1,
        inicio: new Date(hoy.getTime() + 2 * 86400000),
        duracionMin: 45,
        sala: "Sala 2",
      },
    });
    await prisma.reserva.create({
      data: { socioId: socio.id, claseId: creada.id },
    });
  }

  const visitaAbierta = await prisma.visita.findFirst({
    where: { socioId: socio.id, estado: EstadoVisita.ABIERTA },
  });
  if (!visitaAbierta) {
    await prisma.visita.create({
      data: { socioId: socio.id, ingresoAt: hoy, estado: EstadoVisita.ABIERTA },
    });
  }

  // Clase 6 — roles para cuentas de Google reales. Quien entra con Google por
  // primera vez nace SOCIO (lib/auth.ts). Para probar como ADMIN o PROFESOR,
  // poner el mail de Google en estas variables y correr el seed: el upsert le
  // asigna el rol. Es la única forma de subir de rol: la API no la ofrece.
  // Con sesión JWT, el rol nuevo se ve recién al volver a iniciar sesión.
  const rolesPorMail: [string | undefined, Rol][] = [
    [process.env.SEED_ADMIN_EMAIL, Rol.ADMIN],
    [process.env.SEED_PROFESOR_EMAIL, Rol.PROFESOR],
  ];
  for (const [email, rol] of rolesPorMail) {
    if (!email) continue;
    await prisma.user.upsert({
      where: { email },
      update: { rol },
      create: { email, nombre: email, rol },
    });
  }

  console.log("Seed completo.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
