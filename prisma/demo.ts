/**
 * Datos para la demo y para que la cátedra pruebe el sistema: clases desde
 * mañana hasta fin de enero, socios con la membresía al día hasta esa fecha y
 * las cuentas de Google que se van a mostrar listas para usar.
 *
 * Correr con: npm run db:demo
 *
 * Lee la base de `.env.local` (o de las variables del entorno). Las cuentas
 * reales NO se escriben en el repo: se pasan al correrlo, separadas por coma.
 *
 *   DEMO_SOCIO_EMAIL="alguien@gmail.com"     socio que escanea y reserva
 *   DEMO_PROFESOR_EMAIL="otra@gmail.com"     (opcional) profesor de varias clases
 *   DEMO_HASTA="2027-01-31"                  (opcional) último día con clases;
 *                                            por defecto, el 31 de enero que viene
 *
 * El script NUNCA le cambia el rol a una cuenta que ya existe: si la cuenta
 * del socio o del profesor ya tiene otro rol, avisa y la saltea. Para subir a
 * alguien a ADMIN o PROFESOR está el seed (SEED_ADMIN_EMAIL, SEED_PROFESOR_EMAIL).
 *
 * Las clases y sus reservas se crean de a lotes (`createMany`): son unas 200
 * clases, pero alrededor de 60 consultas contra Supabase (Canadá).
 *
 * Se puede correr varias veces: busca antes de crear, igual que el seed. Las
 * fechas son relativas al momento en que se corre (hora de Argentina), así
 * que conviene correrlo la noche anterior o el mismo día de la demo.
 *
 * Domingos, 25 de diciembre y 1 de enero no hay clases.
 *
 * Qué deja preparado para el guion:
 *   - El primer Spinning de las 18:00 de un día hábil (mañana, o el lunes si
 *     se corre viernes o sábado), con un solo lugar libre: el socio de la
 *     demo reserva el último cupo y cualquier otro ya ve "sin cupo". Se
 *     rearma en CADA corrida (cupo 6, cinco reservas), aunque la clase ya
 *     exista de un ensayo anterior.
 *   - El socio de la demo SIN visita abierta: el primer escaneo es un ingreso.
 *   - Una reserva ya hecha del socio, para que "Tus reservas" no esté vacío.
 */
import { config as cargarEnv } from "dotenv";
import { z } from "zod";
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

/** Una fecha `YYYY-MM-DD`, en Argentina, a una hora dada. */
function enArgentina(fecha: string, hora: number, minuto = 0): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(anio, mes - 1, dia, hora + OFFSET_ARGENTINA_HORAS, minuto));
}

/** `YYYY-MM-DD` del día `dias` después de hoy, en Argentina. */
function fechaArgentina(dias: number): string {
  return horaArgentina(dias, 12).toISOString().slice(0, 10);
}

/** El 31 de enero que viene (este mismo enero, si se corre en enero). */
function finDeEneroQueViene(): string {
  const hoy = fechaArgentina(0);
  const anio = Number(hoy.slice(0, 4)) + (hoy.slice(5, 7) === "01" ? 0 : 1);
  return `${anio}-01-31`;
}

const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DEMO_HASTA tiene que ser YYYY-MM-DD");
const FERIADOS_SIN_CLASES = ["12-25", "01-01"];

const listaDeMails = z.array(z.string().trim().toLowerCase().email());

/** Mails separados por coma; si alguno no es un mail, corta antes de tocar la base. */
function mails(nombre: string): string[] {
  const crudos = (process.env[nombre] ?? "").split(",").filter((m) => m.trim() !== "");
  const validacion = listaDeMails.safeParse(crudos);
  if (!validacion.success) throw new Error(`${nombre} tiene un mail inválido: ${crudos.join(", ")}`);
  return validacion.data;
}

/**
 * Busca la cuenta real o la crea con `rol`. Si ya existe con OTRO rol, no la
 * toca (podría ser un admin o un socio de verdad) y devuelve null.
 */
async function cuentaReal(email: string, rol: Rol): Promise<User | null> {
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente && existente.rol !== rol) {
    console.warn(`${email} es ${existente.rol}: no se cambia a ${rol}. Se saltea.`);
    return null;
  }
  return existente ?? usuario(email, email.split("@")[0] ?? email, rol);
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

/**
 * Membresía ACTIVA que cubre hasta `hasta`, con su pago aprobado. Un socio
 * tiene UNA sola ACTIVA (índice `Membresia_socio_activa_key`): si la que tiene
 * vence antes de `hasta`, no se le crea otra, se la renueva como lo hace la
 * H7 —un pago aprobado por período, contado desde el vencimiento vigente—.
 * Así correr la demo dos veces no suma ni membresías ni pagos.
 */
async function asegurarMembresia(socioId: string, plan: Plan, inicioHaceDias: number, hasta: Date) {
  const ahora = new Date();
  const actual = await prisma.membresia.findFirst({
    where: { socioId, estado: EstadoMembresia.ACTIVA },
    orderBy: { fechaFin: "desc" },
    include: { plan: true },
  });
  if (!actual) {
    const fechaInicio = new Date(ahora.getTime() - inicioHaceDias * DIA);
    let fechaFin = new Date(fechaInicio.getTime() + plan.duracionDias * DIA);
    const pagos = [{ monto: String(plan.precio), fecha: fechaInicio, medio: MedioPago.EFECTIVO, estado: EstadoPago.APROBADO }];
    while (fechaFin < hasta) {
      pagos.push({ monto: String(plan.precio), fecha: ahora, medio: MedioPago.EFECTIVO, estado: EstadoPago.APROBADO });
      fechaFin = new Date(fechaFin.getTime() + plan.duracionDias * DIA);
    }
    return prisma.membresia.create({
      data: { socioId, planId: plan.id, fechaInicio, fechaFin, estado: EstadoMembresia.ACTIVA, pagos: { create: pagos } },
    });
  }
  if (actual.fechaFin >= hasta) return actual;

  let fechaFin = actual.fechaFin > ahora ? actual.fechaFin : ahora;
  let renovaciones = 0;
  while (fechaFin < hasta) {
    fechaFin = new Date(fechaFin.getTime() + actual.plan.duracionDias * DIA);
    renovaciones++;
  }
  return prisma.membresia.update({
    where: { id: actual.id },
    data: {
      fechaFin,
      pagos: {
        create: Array.from({ length: renovaciones }, () => ({
          monto: String(actual.plan.precio), fecha: ahora, medio: MedioPago.EFECTIVO, estado: EstadoPago.APROBADO,
        })),
      },
    },
  });
}

async function reservar(socioId: string, claseId: string) {
  const existente = await prisma.reserva.findFirst({ where: { socioId, claseId, estado: "CONFIRMADA" } });
  return existente ?? prisma.reserva.create({ data: { socioId, claseId } });
}

/**
 * La clase del "último cupo": cupo 6 y exactamente cinco reservas
 * confirmadas, de los socios de ejemplo. Cualquier otra reserva confirmada
 * (por ejemplo, la del socio de la demo en un ensayo) se cancela, así el
 * guion se puede repetir.
 */
async function dejarUnLugarLibre(claseId: string, cinco: User[]) {
  const ids = cinco.map((s) => s.id);
  await prisma.clase.update({ where: { id: claseId }, data: { cupoMaximo: ids.length + 1 } });
  await prisma.reserva.updateMany({ where: { claseId, estado: "CONFIRMADA", socioId: { notIn: ids } }, data: { estado: "CANCELADA" } });
  for (const id of ids) await reservar(id, claseId);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL: completá .env.local antes de correr la demo.");
  // Los mails se validan antes de escribir nada en la base.
  const mailsSocio = mails("DEMO_SOCIO_EMAIL");
  const mailsProfesor = mails("DEMO_PROFESOR_EMAIL");
  const hastaTexto = fechaSchema.parse(process.env.DEMO_HASTA?.trim() || finDeEneroQueViene());
  const hasta = enArgentina(hastaTexto, 23, 59);
  if (hasta.getTime() <= Date.now()) throw new Error(`DEMO_HASTA (${hastaTexto}) ya pasó.`);

  console.log("Conectando a la base y cargando planes…");
  const { trimestral, anual } = await planes();

  // Profesores: los ficticios y, si se pasó, la cuenta real de la demo.
  const profes: User[] = [
    await usuario("profe@ejemplo.com", "Profe", Rol.PROFESOR),
    await usuario("lucia.gomez@ejemplo.com", "Lucía Gómez", Rol.PROFESOR),
    await usuario("martin.ruiz@ejemplo.com", "Martín Ruiz", Rol.PROFESOR),
  ];
  for (const email of mailsProfesor) {
    const profesor = await cuentaReal(email, Rol.PROFESOR);
    if (profesor) profes.unshift(profesor);
  }

  console.log("Socios de ejemplo…");
  // Socios ficticios con la membresía al día hasta `hasta`: llenan los cupos.
  const nombres = ["Valentina Pérez", "Tomás Fernández", "Camila López", "Joaquín Martínez", "Sofía Romero", "Mateo Díaz", "Martina Álvarez", "Benjamín Torres"];
  const socios: User[] = [];
  for (const [i, nombre] of nombres.entries()) {
    const email = `${nombre.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(" ", ".")}@ejemplo.com`;
    const socio = await usuario(email, nombre, Rol.SOCIO);
    // Trimestral o anual, empezada hace pocos días: así cubre hasta fin de enero.
    await asegurarMembresia(socio.id, i % 2 === 0 ? anual : trimestral, 2 + i, hasta);
    socios.push(socio);
  }

  // Clases desde mañana hasta `hasta` (lunes a sábado), horarios de Argentina.
  type Hueco = { hora: number; minuto?: number; nombre: string; duracionMin: number; cupoMaximo: number; sala: string };
  const grilla: Hueco[] = [
    { hora: 8, nombre: "Funcional", duracionMin: 45, cupoMaximo: 15, sala: "Sala 2" },
    { hora: 18, nombre: "Spinning", duracionMin: 50, cupoMaximo: 20, sala: "Principal" },
    { hora: 19, minuto: 30, nombre: "Yoga", duracionMin: 60, cupoMaximo: 12, sala: "Sala 3" },
  ];
  const sabado: Hueco[] = [{ hora: 10, nombre: "Spinning", duracionMin: 50, cupoMaximo: 20, sala: "Principal" }];
  type Turno = { nombre: string; profesorId: string; cupoMaximo: number; inicio: Date; duracionMin: number; sala: string; dia: number; anotados: number; ultimoCupo: boolean };
  const turnos: Turno[] = [];
  let ultimoCupoListo = false;
  for (let dia = 1; fechaArgentina(dia) <= hastaTexto; dia++) {
    const fecha = fechaArgentina(dia);
    const diaSemana = horaArgentina(dia, 12).getUTCDay(); // 0 domingo … 6 sábado
    if (diaSemana === 0 || FERIADOS_SIN_CLASES.includes(fecha.slice(5))) continue;
    for (const [j, item] of (diaSemana === 6 ? sabado : grilla).entries()) {
      // El primer Spinning de las 18 en un día hábil: con un solo lugar libre.
      // No "mañana": un viernes o un sábado, mañana no hay clase a las 18.
      const ultimoCupo = !ultimoCupoListo && item.hora === 18;
      if (ultimoCupo) ultimoCupoListo = true;
      turnos.push({
        nombre: item.nombre, profesorId: (profes[(dia + j) % profes.length] ?? profes[0]!).id,
        cupoMaximo: ultimoCupo ? 6 : item.cupoMaximo, inicio: enArgentina(fecha, item.hora, item.minuto ?? 0),
        duracionMin: item.duracionMin, sala: item.sala, dia, anotados: (dia * 3 + j * 2) % 7, ultimoCupo,
      });
    }
  }

  // Se busca solo entre las clases de los profesores del script: una clase
  // real con el mismo nombre y horario, de otro profesor, no se toca.
  const idsProfes = profes.map((p) => p.id);
  const clave = (c: { nombre: string; inicio: Date }) => `${c.nombre}|${c.inicio.toISOString()}`;
  const rango = { gte: turnos[0]?.inicio ?? hasta, lte: hasta };
  const existentes = new Set(
    (await prisma.clase.findMany({ where: { profesorId: { in: idsProfes }, inicio: rango }, select: { nombre: true, inicio: true } })).map(clave),
  );
  const nuevas = turnos.filter((t) => !existentes.has(clave(t)));
  console.log(`Clases: ${turnos.length} hasta el ${hastaTexto}, ${nuevas.length} nuevas…`);
  await prisma.clase.createMany({
    data: nuevas.map(({ nombre, profesorId, cupoMaximo, inicio, duracionMin, sala }) => ({ nombre, profesorId, cupoMaximo, inicio, duracionMin, sala })),
  });
  const guardadas = await prisma.clase.findMany({ where: { profesorId: { in: idsProfes }, inicio: rango }, select: { id: true, nombre: true, inicio: true } });
  const idPorClave = new Map<string, string>(guardadas.map((c: { id: string; nombre: string; inicio: Date }) => [clave(c), c.id]));
  const idDe = (t: Turno) => {
    const id = idPorClave.get(clave(t));
    if (!id) throw new Error(`No se encontró la clase ${clave(t)}`);
    return id;
  };

  // Reservas de los socios ficticios, de a lotes. `skipDuplicates` respeta el
  // índice único parcial: una reserva confirmada que ya estaba no se repite.
  console.log("Reservas…");
  await prisma.reserva.createMany({
    data: turnos
      .filter((t) => !t.ultimoCupo)
      .flatMap((t) => socios.slice(0, t.anotados).map((socio) => ({ socioId: socio.id, claseId: idDe(t) }))),
    skipDuplicates: true,
  });
  const ultimo = turnos.find((t) => t.ultimoCupo);
  if (ultimo) await dejarUnLugarLibre(idDe(ultimo), socios.slice(0, 5));

  // Las cuentas reales del socio de la demo.
  const yogaTurno = turnos.find((t) => t.dia >= 2 && t.nombre === "Yoga");
  const yoga = yogaTurno ? { id: idDe(yogaTurno) } : undefined;
  for (const email of mailsSocio) {
    const socio = await cuentaReal(email, Rol.SOCIO);
    if (!socio) continue;
    await asegurarMembresia(socio.id, trimestral, 3, hasta);
    if (yoga) await reservar(socio.id, yoga.id);
    // Sin visita abierta: el primer escaneo de la demo tiene que ser un ingreso.
    await prisma.visita.updateMany({ where: { socioId: socio.id, estado: EstadoVisita.ABIERTA }, data: { estado: EstadoVisita.INCOMPLETA } });
    console.log(`Socio de la demo listo: ${email}`);
  }

  console.log(`Demo lista: ${turnos.length} clases hasta el ${hastaTexto}, ${socios.length} socios con membresía.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
