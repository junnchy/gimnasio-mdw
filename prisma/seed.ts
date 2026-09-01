/**
 * Datos de ejemplo para desarrollo.
 *
 * Correr con: npm run db:seed
 *
 * Por qué existe: para que los cuatro integrantes del equipo trabajen contra
 * los mismos datos y para poder mostrar el sistema sin cargar todo a mano.
 * Debe poder correrse varias veces sin romper (por eso usamos upsert).
 */
import { PrismaClient, Rol } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.usuario.upsert({
    where: { email: "admin@ejemplo.com" },
    update: {},
    create: {
      email: "admin@ejemplo.com",
      nombre: "Admin de ejemplo",
      rol: Rol.ADMIN,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "profesor@ejemplo.com" },
    update: {},
    create: {
      email: "profesor@ejemplo.com",
      nombre: "Profesor de ejemplo",
      rol: Rol.PROFESOR,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "socio@ejemplo.com" },
    update: {},
    create: {
      email: "socio@ejemplo.com",
      nombre: "Socio de ejemplo",
      rol: Rol.SOCIO,
    },
  });

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
