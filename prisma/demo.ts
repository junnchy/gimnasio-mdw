/**
 * Datos para la demo de la entrega: una semana de clases, socios con
 * membresía y las cuentas de Google que se van a mostrar listas para usar.
 *
 * Correr con: npm run db:demo
 *
 * Lee la base de `.env.local` (o de las variables del entorno). Las cuentas
 * reales NO se escriben en el repo: se pasan al correrlo, separadas por coma.
 *
 *   DEMO_SOCIO_EMAIL="alguien@gmail.com"   socio que escanea y reserva
 *   SEED_PROFESOR_EMAIL="otra@gmail.com"   (opcional) profesor de varias clases
 *   SEED_ADMIN_EMAIL="otra-mas@gmail.com"  (opcional) admin
 *
 * Tarda uno o dos minutos: son unas 200 consultas, una tras otra, contra la
 * base de Supabase (Canadá). Va mostrando el avance.
 *
 * Se puede correr varias veces: busca antes de crear, igual que el seed. Las
 * fechas son relativas al momento en que se corre (hora de Argentina), así
 * que conviene correrlo la noche anterior o el mismo día de la demo.
 *
 * Qué deja preparado para el guion:
 *   - Mañana a las 18:00, "Spinning" con un solo lugar libre: el socio de la
 *     demo reserva el último cupo y cualquier otro ya ve "sin cupo".
 *   - El socio de la demo SIN visita abierta: el primer escaneo es un ingreso.
 *   - Una reserva ya hecha del socio, para que "Tus reservas" no esté vacío.
 */
import { config as cargarEnv } from "dotenv";
import { PrismaClient, Rol, EstadoMembresia, EstadoVisita, MedioPago, EstadoPago, type Plan, type User } from "@prisma/client";

// Las mismas variables que usan la app y el seed (prisma.config.ts).
cargarEnv({ path: ".env.local", quiet: true });
cargarEnv({ path: ".env", quiet: true });

const prisma = new PrismaClient();
const DIA = 86_400_000;
const OFFSET_ARGENTINA_HORAS = 3; // UTC-3, sin horario de verano.

/** Fecha a una hora de Argentina, `dias` días después de hoy (en Argentina). */
function horaArgentina(dias: number, hora: number, minuto = 0): Date {
  const hoyAr = new Date(Date.now() - OFFSET_ARGENTINA_HORAS * 3_600_000);
  return new Date(Date.UTC(hoyAr.getUTCFullYear(), hoyAr.getUTCMonth(), hoyAr.getUTCDate() + dias, hora + OFFSET_ARGENTINA_HORAS, minuto));
}

function mails(variable: string | undefined): string[] {
  return (variable ?? "").split(",").map((m) => m.trim().toLowerCase()).filter(Boolean);
}

async function usuario(email: string, nombre: string, rol: Rol): Promise<User> {
  return prisma.user.upsert({ where: { email }, update: {}, create: { email, nombre, rol } });
}

async function planes() {
  const datos = [
    { nombre: "Mensual", descripcion: "Acceso ilimitado", precio: 30000, duracionDias: 30 },
    { nombre: "Trimestral", descripcion: "Acceso ilimitado, tres meses", precio: 81000, duracionDias: 90 },
    { nombre: "Anual", descripcion: "Acceso ilimitado, doce meses", precio: 300000, duracionDias: 365 },
  ];
  const [mensual, trimestral, anual] = await Promise.all(
    datos.map((plan) => prisma.plan.upsert({ where: { nombre: plan.nombre }, update: {}, create: plan })),
  ) as [Plan, Plan, Plan];
  return { mensual, trimestral, anual };
}

/** Membresía ACTIVA vigente con su pago aprobado, si el socio no tiene una. */
async function asegurarMembresia(socioId: string, plan: Plan, inicioHaceDias: number) {
  const ahora = new Date();
  const vigente = await prisma.membresia.findFirst({ where: { socioId, estado: EstadoMembresia.ACTIVA, fechaFin: { gt: ahora } } });
  if (vigente) return vigente;
  const fechaInicio = new Date(ahora.getTime() - inicioHaceDias * DIA);
  return prisma.membresia.create({
    data: {
      socioId, planId: plan.id, fechaInicio, fechaFin: new Date(fechaInicio.getTime() + plan.duracionDias * DIA), estado: EstadoMembresia.ACTIVA,
      pagos: { create: { monto: String(plan.precio), fecha: fechaInicio, medio: MedioPago.EFECTIVO, estado: EstadoPago.APROBADO } },
    },
  });
}

async function clase(datos: { nombre: string; profesorId: string; cupoMaximo: number; inicio: Date; duracionMin: number; sala: string }) {
  const existente = await prisma.clase.findFirst({ where: { nombre: datos.nombre, inicio: datos.inicio } });
  return existente ?? prisma.clase.create({ data: datos });
}

async function reservar(socioId: string, claseId: string) {
  const existente = await prisma.reserva.findFirst({ where: { socioId, claseId, estado: "CONFIRMADA" } });
  return existente ?? prisma.reserva.create({ data: { socioId, claseId } });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL: completá .env.local antes de correr la demo.");

  console.log("Conectando a la base y cargando planes…");
  const { mensual, trimestral, anual } = await planes();

  // Profesores: los ficticios y, si se pasó, la cuenta real de la demo.
  const profes: User[] = [
    await usuario("profe@ejemplo.com", "Profe", Rol.PROFESOR),
    await usuario("lucia.gomez@ejemplo.com", "Lucía Gómez", Rol.PROFESOR),
    await usuario("martin.ruiz@ejemplo.com", "Martín Ruiz", Rol.PROFESOR),
  ];
  for (const email of mails(process.env.SEED_PROFESOR_EMAIL)) {
    profes.unshift(await prisma.user.upsert({ where: { email }, update: { rol: Rol.PROFESOR }, create: { email, nombre: email, rol: Rol.PROFESOR } }));
  }
  for (const email of mails(process.env.SEED_ADMIN_EMAIL)) {
    await prisma.user.upsert({ where: { email }, update: { rol: Rol.ADMIN }, create: { email, nombre: email, rol: Rol.ADMIN } });
  }

  console.log("Socios de ejemplo…");
  // Socios ficticios con membresía al día: llenan los cupos de las clases.
  const nombres = ["Valentina Pérez", "Tomás Fernández", "Camila López", "Joaquín Martínez", "Sofía Romero", "Mateo Díaz", "Martina Álvarez", "Benjamín Torres"];
  const socios: User[] = [];
  for (const [i, nombre] of nombres.entries()) {
    const email = `${nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(" ", ".")}@ejemplo.com`;
    const socio = await usuario(email, nombre, Rol.SOCIO);
    await asegurarMembresia(socio.id, i % 3 === 0 ? anual : i % 3 === 1 ? trimestral : mensual, 5 + i * 3);
    socios.push(socio);
  }

  // Una semana de clases desde mañana (lunes a sábado), horarios de Argentina.
  const grilla: { hora: number; minuto?: number; nombre: string; duracionMin: number; cupoMaximo: number; sala: string }[] = [
    { hora: 8, nombre: "Funcional", duracionMin: 45, cupoMaximo: 15, sala: "Sala 2" },
    { hora: 18, nombre: "Spinning", duracionMin: 50, cupoMaximo: 20, sala: "Principal" },
    { hora: 19, minuto: 30, nombre: "Yoga", duracionMin: 60, cupoMaximo: 12, sala: "Sala 3" },
  ];
  const creadas = [];
  for (let dia = 1; dia <= 7; dia++) {
    const fecha = horaArgentina(dia, 12);
    const diaSemana = fecha.getUTCDay(); // 0 domingo … 6 sábado
    if (diaSemana === 0) continue;
    const delDia = diaSemana === 6 ? [{ hora: 10, nombre: "Spinning", duracionMin: 50, cupoMaximo: 20, sala: "Principal" }] : grilla;
    for (const [j, item] of delDia.entries()) {
      // Mañana a las 18: el Spinning con un solo lugar libre para la demo.
      const ultimoCupo = dia === 1 && item.hora === 18;
      const profesor = profes[(dia + j) % profes.length] ?? profes[0]!;
      const c = await clase({
        nombre: item.nombre, profesorId: profesor.id,
        cupoMaximo: ultimoCupo ? 6 : item.cupoMaximo, inicio: horaArgentina(dia, item.hora, item.minuto ?? 0),
        duracionMin: item.duracionMin, sala: item.sala,
      });
      const cuantas = ultimoCupo ? 5 : (dia * 3 + j * 2) % 7;
      for (const socio of socios.slice(0, cuantas)) await reservar(socio.id, c.id);
      creadas.push({ c, dia, item });
      console.log(`Clase ${creadas.length}: ${item.nombre} ${c.inicio.toISOString().slice(0, 16)} UTC`);
    }
  }

  // Las cuentas reales del socio de la demo.
  const yoga = creadas.find(({ dia, item }) => dia >= 2 && item.nombre === "Yoga")?.c;
  for (const email of mails(process.env.DEMO_SOCIO_EMAIL)) {
    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente && existente.rol !== Rol.SOCIO) {
      console.warn(`${email} es ${existente.rol}: no se cambia a SOCIO. Usá otra cuenta para mostrar el escaneo.`);
      continue;
    }
    const socio = existente ?? (await usuario(email, email.split("@")[0] ?? email, Rol.SOCIO));
    await asegurarMembresia(socio.id, mensual, 3);
    if (yoga) await reservar(socio.id, yoga.id);
    // Sin visita abierta: el primer escaneo de la demo tiene que ser un ingreso.
    await prisma.visita.updateMany({ where: { socioId: socio.id, estado: EstadoVisita.ABIERTA }, data: { estado: EstadoVisita.INCOMPLETA } });
    console.log(`Socio de la demo listo: ${email}`);
  }

  console.log(`Demo lista: ${creadas.length} clases en la semana, ${socios.length} socios con membresía.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
