import { z } from "zod";

// Identificador (Prisma usa cuid por defecto).
export const id = z.string().min(1, "id requerido");

// Uniones literales para estados: NUNCA strings sueltos (regla de la cátedra).
export const rolUsuario = z.enum(["ADMIN", "PROFESOR", "SOCIO"]);
export type RolUsuario = z.infer<typeof rolUsuario>;

// Qué SÍ se guarda: hechos que alguien realizó (pago aprobado, cancelación).
// VENCIDA NO es un valor válido de entrada ni de base: se vence sola cuando
// `fechaFin` es anterior a hoy (spec §6), así que se calcula al leer. Que el
// schema y la base den el mismo resultado es una regla de la clase 3.
export const estadoMembresia = z.enum(["ACTIVA", "CANCELADA"]);
export type EstadoMembresia = z.infer<typeof estadoMembresia>;

export const medioPago = z.enum(["EFECTIVO", "MP"]);
export type MedioPago = z.infer<typeof medioPago>;

export const estadoPago = z.enum(["APROBADO", "PENDIENTE", "RECHAZADO"]);
export type EstadoPago = z.infer<typeof estadoPago>;

export const estadoReserva = z.enum(["CONFIRMADA", "CANCELADA"]);
export type EstadoReserva = z.infer<typeof estadoReserva>;

export const estadoVisita = z.enum(["ABIERTA", "CERRADA", "INCOMPLETA"]);
export type EstadoVisita = z.infer<typeof estadoVisita>;
