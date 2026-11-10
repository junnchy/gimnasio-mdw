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
 * el `AUTH_SECRET` (clase 6). Esto escribe LA MISMA cookie, con el mismo
 * secreto y la misma función —`encode`, de Auth.js— y con lo mismo adentro
 * que arma el callback `jwt` de `lib/auth.ts`, y la guarda en un archivo que
 * el navegador de la prueba carga antes de entrar.
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
import { EstadoMembresia, PrismaClient, Rol, type User } from "@prisma/client";
import { encode } from "next-auth/jwt";
import QRCode from "qrcode";
import { exigirBaseLocal } from "./base-local";
import { DATOS, PERSONAS, QR_DE_LA_PUERTA, SESION, type DatosDePrueba } from "./sesiones";

/** El nombre de la cookie en http. En https Auth.js le agrega `__Secure-`. */
const COOKIE = "authjs.session-token";
const DIA = 86_400_000;

async function guardarSesion(archivo: string, usuario: User) {
  // El contenido es el que arma el callback `jwt` de `lib/auth.ts`: el id de
  // NUESTRA base y el rol. Por eso el usuario tiene que existir en la base.
  const valor = await encode({
    token: {
      sub: usuario.id,
      email: usuario.email,
      name: usuario.nombre,
      usuarioId: usuario.id,
      rol: usuario.rol,
    },
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE,
  });

  mkdirSync(path.dirname(archivo), { recursive: true });
  writeFileSync(
    archivo,
    JSON.stringify({
      cookies: [
        {
          name: COOKIE,
          value: valor,
          domain: "localhost",
          path: "/",
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  );
}

export default async function preparar() {
  // Otra vez, por si alguien corre este archivo sin pasar por la config.
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

    // La socia del flujo arranca afuera del gimnasio y con la cuota al día:
    // su primer escaneo tiene que ser un ingreso.
    await prisma.visita.deleteMany({ where: { socioId: socio.id } });
    const plan = await prisma.plan.findUniqueOrThrow({ where: { nombre: "Mensual" } });
    const hoy = new Date();
    await prisma.membresia.deleteMany({ where: { socioId: socio.id } });
    await prisma.membresia.create({
      data: {
        socioId: socio.id,
        planId: plan.id,
        fechaInicio: hoy,
        fechaFin: new Date(hoy.getTime() + 30 * DIA),
        estado: EstadoMembresia.ACTIVA,
      },
    });

    // Una clase del profe, la semana que viene, con una reserva de la socia:
    // lo "propio" que los demás intentan tocar en e2e/permisos.spec.ts.
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

    const datos: DatosDePrueba = { claseId: clase.id, reservaId: reserva.id };
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
