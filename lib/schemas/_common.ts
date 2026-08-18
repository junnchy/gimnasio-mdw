import { z } from "zod";

// Identificador (Prisma usa cuid por defecto).
export const id = z.string().min(1, "id requerido");

// Uniones literales para estados: NUNCA strings sueltos (regla de la cátedra).
export const rolUsuario = z.enum(["ADMIN", "PROFESOR", "SOCIO"]);
export type RolUsuario = z.infer<typeof rolUsuario>;

export const estadoMembresia = z.enum(["ACTIVA", "VENCIDA", "CANCELADA"]);
export type EstadoMembresia = z.infer<typeof estadoMembresia>;

export const medioPago = z.enum(["EFECTIVO", "MP"]);
export type MedioPago = z.infer<typeof medioPago>;

export const estadoPago = z.enum(["APROBADO", "PENDIENTE", "RECHAZADO"]);
export type EstadoPago = z.infer<typeof estadoPago>;

export const momentoComida = z.enum([
  "DESAYUNO",
  "ALMUERZO",
  "MERIENDA",
  "CENA",
  "SNACK",
]);
export type MomentoComida = z.infer<typeof momentoComida>;

export const estadoReserva = z.enum(["CONFIRMADA", "CANCELADA"]);
export type EstadoReserva = z.infer<typeof estadoReserva>;

export const estadoVisita = z.enum(["ABIERTA", "CERRADA", "INCOMPLETA"]);
export type EstadoVisita = z.infer<typeof estadoVisita>;
