import { z } from "zod";
import { rolUsuario } from "./_common";

// User no cuenta como "entidad de dominio" para el requisito de la cátedra,
// pero define el contrato de autenticación y roles.
// Naming unificado con el dominio y el schema.prisma: campo `rol`.
export const userSchema = z.object({
  email: z.string().email().max(254),
  nombre: z.string().min(2).max(80),
  rol: rolUsuario.default("SOCIO"),
});
export type User = z.infer<typeof userSchema>;
