/**
 * Corre una vez antes de todas las pruebas: deja la base lista, arma una
 * sesión por cada persona que las pruebas necesitan y dibuja el QR de la puerta.
 *
 * ---------------------------------------------------------------------------
 * LAS PRUEBAS NO PASAN POR GOOGLE
 * ---------------------------------------------------------------------------
 * No pueden: el login de Google pide una persona, una contraseña y a veces un
 * celular. Y tampoco hace falta, porque lo que se quiere probar es Pulso, no
 * a Google.
 *
 * Lo que hace Google, al final, es que Auth.js escriba una cookie cifrada con
 * el `AUTH_SECRET` (clase 6). `e2e/sesion.ts` arma LA MISMA cookie, con el
 * mismo secreto y la misma función —`encode`, de Auth.js— y con lo mismo
 * adentro que arma el callback `jwt` de `lib/auth.ts`. Acá se guarda en un
 * archivo que el navegador de la prueba carga antes de entrar.
 *
 * Fijate lo que NO hay: ningún "modo prueba" en `lib/auth.ts`, ningún usuario
 * mágico, ningún `if (process.env.E2E)`. Una puerta trasera para los tests es
 * una puerta trasera, y tarde o temprano llega a producción. Acá el código de
 * la app es exactamente el que corre en Vercel; lo único distinto es el
 * secreto, que en producción nadie conoce.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient, Rol } from "@prisma/client";
import QRCode from "qrcode";
import { exigirBaseLocal } from "./base-local";
import { reiniciarSocia } from "./estado";
import { COOKIE_SESION, valorDeSesion, type UsuarioDePrueba } from "./sesion";
import { DATOS, PERSONAS, QR_DE_LA_PUERTA, SESION, type DatosDePrueba } from "./sesiones";

const DIA = 86_400_000;

/**
 * Guarda la cookie de `usuario` en el formato que carga el navegador de las
 * pruebas (`test.use({ storageState })`). La cookie la arma `e2e/sesion.ts`,
 * la misma que usa `concurrencia.spec.ts`: hay una sola forma de fabricarla.
 * El usuario tiene que existir en la base: la cookie lleva su id y su rol.
 */
async function guardarSesion(archivo: string, usuario: UsuarioDePrueba) {
  const cookie = {
    name: COOKIE_SESION,
    value: await valorDeSesion(usuario),
    domain: "localhost",
    path: "/",
    expires: -1,
    httpOnly: true,
    secure: false,
    sameSite: "Lax" as const,
  };
  mkdirSync(path.dirname(archivo), { recursive: true });
  writeFileSync(archivo, JSON.stringify({ cookies: [cookie], origins: [] }));
}

export default async function preparar() {
  // Otra vez acá, antes de migrar: `prisma migrate deploy` usa DIRECT_URL, y
  // este control no depende de que alguien haya corrido la config primero.
  exigirBaseLocal();

  // La base, al día con las migraciones y con los datos del seed: cada
  // corrida arranca del mismo punto.
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  execSync("npx prisma db seed", { stdio: "inherit" });

  const prisma = new PrismaClient();

  try {
    const buscar = (email: string) => prisma.user.findUniqueOrThrow({ where: { email } });
    const crear = (persona: { email: string; nombre: string }, rol: Rol) =>
      prisma.user.upsert({ where: { email: persona.email }, update: {}, create: { ...persona, rol } });

    // Del seed: profesor, admin y el socio con la membresía vencida.
    const profesor = await buscar(PERSONAS.profesor.email);
    const admin = await buscar(PERSONAS.admin.email);
    const socioVencido = await buscar(PERSONAS.socioVencido.email);

    // Solo las necesitan las pruebas: la socia que recorre el flujo, un socio
    // que intenta tocar lo de ella y una profesora que intenta tocar lo del profe.
    const socio = await crear(PERSONAS.socio, Rol.SOCIO);
    const otroSocio = await crear(PERSONAS.otroSocio, Rol.SOCIO);
    const otroProfesor = await crear(PERSONAS.otroProfesor, Rol.PROFESOR);

    // La socia del flujo arranca afuera del gimnasio y con la cuota al día.
    await reiniciarSocia(prisma);
    const hoy = new Date();
    const plan = await prisma.plan.findUniqueOrThrow({ where: { nombre: "Mensual" } });

    // Lo "propio" que los demás intentan tocar en e2e/permisos.spec.ts: una
    // clase del profe, la semana que viene, con una reserva de la socia, y
    // una rutina que el profe le armó.
    const clase =
      (await prisma.clase.findFirst({ where: { nombre: "Clase E2E", profesorId: profesor.id } })) ??
      (await prisma.clase.create({
        data: {
          nombre: "Clase E2E",
          profesorId: profesor.id,
          cupoMaximo: 10,
          inicio: new Date(hoy.getTime() + 7 * DIA),
          duracionMin: 60,
          sala: "Principal",
        },
      }));
    const reserva =
      (await prisma.reserva.findFirst({ where: { socioId: socio.id, claseId: clase.id } })) ??
      (await prisma.reserva.create({ data: { socioId: socio.id, claseId: clase.id } }));

    const rutina =
      (await prisma.rutina.findFirst({ where: { nombre: "Rutina E2E", profesorId: profesor.id, socioId: socio.id } })) ??
      (await prisma.rutina.create({ data: { nombre: "Rutina E2E", profesorId: profesor.id, socioId: socio.id } }));
    // Un ejercicio que existe (del seed): si la profesora ajena recibe 404 al
    // agregarlo, es por la rutina, no porque el ejercicio no exista.
    const ejercicio = await prisma.ejercicio.findFirstOrThrow({ where: { nombre: "Sentadilla" } });

    const datos: DatosDePrueba = {
      claseId: clase.id,
      reservaId: reserva.id,
      rutinaId: rutina.id,
      ejercicioId: ejercicio.id,
      planId: plan.id,
    };
    mkdirSync(path.dirname(DATOS), { recursive: true });
    writeFileSync(DATOS, JSON.stringify(datos));

    await guardarSesion(SESION.socio, socio);
    await guardarSesion(SESION.socioVencido, socioVencido);
    await guardarSesion(SESION.otroSocio, otroSocio);
    await guardarSesion(SESION.profesor, profesor);
    await guardarSesion(SESION.otroProfesor, otroProfesor);
    await guardarSesion(SESION.admin, admin);

    // El QR fijo de la puerta (spec §5, paso 1). El navegador de las pruebas
    // no tiene cámara: sube esta imagen, como lo permite /escanear.
    await QRCode.toFile(QR_DE_LA_PUERTA, process.env.QR_TOKEN!, { width: 400, margin: 4 });
  } finally {
    await prisma.$disconnect();
  }
}
