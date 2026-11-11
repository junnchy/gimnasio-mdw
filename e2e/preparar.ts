/**
 * Corre una vez antes de todas las pruebas: deja la base al día con las
 * migraciones y los datos del seed, y guarda una sesión por cada rol para el
 * navegador de las pruebas (`test.use({ storageState: SESION.socio })`).
 *
 * El seed es idempotente (prisma/seed.ts): cada corrida arranca del mismo punto.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { exigirBasesLocales } from "./base-local";
import { COOKIE_SESION, valorDeSesion, type UsuarioDePrueba } from "./sesion";
import { SESION } from "./sesiones";

async function guardarSesion(archivo: string, usuario: UsuarioDePrueba) {
  mkdirSync(path.dirname(archivo), { recursive: true });
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
  writeFileSync(archivo, JSON.stringify({ cookies: [cookie], origins: [] }));
}

export default async function preparar() {
  // Otra vez acá, antes de migrar: `prisma migrate deploy` usa DIRECT_URL, y
  // este control no depende de que alguien haya corrido la config primero.
  exigirBasesLocales(process.env);
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  execSync("npx prisma db seed", { stdio: "inherit" });

  const prisma = new PrismaClient();
  try {
    const buscar = (email: string) => prisma.user.findUniqueOrThrow({ where: { email } });
    await guardarSesion(SESION.socio, await buscar("socio@ejemplo.com"));
    await guardarSesion(SESION.profesor, await buscar("profe@ejemplo.com"));
    await guardarSesion(SESION.admin, await buscar("admin@ejemplo.com"));
  } finally {
    await prisma.$disconnect();
  }
}
