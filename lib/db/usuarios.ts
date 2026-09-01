import { prisma } from "@/lib/db/client";

const emailPorRol = {
  ADMIN: "admin@ejemplo.com",
  PROFESOR: "profe@ejemplo.com",
  SOCIO: "socio@ejemplo.com",
} as const;

export async function obtenerIdUsuarioDeEjemplo(rol: keyof typeof emailPorRol) {
  const usuario = await prisma.user.findUnique({ where: { email: emailPorRol[rol] }, select: { id: true } });
  if (!usuario) throw new Error("Falta ejecutar npm run db:seed");
  return usuario.id;
}
