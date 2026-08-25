/*
  Warnings:

  - The values [USUARIO] on the enum `Rol` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Nota` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoMembresia" AS ENUM ('ACTIVA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'MP');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('APROBADO', 'PENDIENTE', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('CONFIRMADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('ABIERTA', 'CERRADA', 'INCOMPLETA');

-- AlterEnum
BEGIN;
CREATE TYPE "Rol_new" AS ENUM ('ADMIN', 'PROFESOR', 'SOCIO');
ALTER TABLE "public"."Usuario" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "public"."Usuario" ALTER COLUMN "rol" TYPE "Rol_new" USING ("rol"::text::"Rol_new");
ALTER TYPE "Rol" RENAME TO "Rol_old";
ALTER TYPE "Rol_new" RENAME TO "Rol";
DROP TYPE "public"."Rol_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Nota" DROP CONSTRAINT "Nota_autorId_fkey";

-- DropTable
DROP TABLE "Nota";

-- DropTable
DROP TABLE "Usuario";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'SOCIO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(65,30) NOT NULL,
    "duracionDias" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membresia" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoMembresia" NOT NULL DEFAULT 'ACTIVA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "membresiaId" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "refExterna" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rutina" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT,
    "profesorId" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rutina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ejercicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupoMuscular" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagenUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ejercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RutinaEjercicio" (
    "id" TEXT NOT NULL,
    "rutinaId" TEXT NOT NULL,
    "ejercicioId" TEXT NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticiones" INTEGER NOT NULL,
    "descansoSeg" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RutinaEjercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clase" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "cupoMaximo" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "duracionMin" INTEGER NOT NULL,
    "sala" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'CONFIRMADA',
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visita" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "ingresoAt" TIMESTAMP(3) NOT NULL,
    "egresoAt" TIMESTAMP(3),
    "estado" "EstadoVisita" NOT NULL,
    "duracionMin" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membresia_socioId_idx" ON "Membresia"("socioId");

-- CreateIndex
CREATE INDEX "Membresia_planId_idx" ON "Membresia"("planId");

-- CreateIndex
CREATE INDEX "Membresia_estado_fechaFin_idx" ON "Membresia"("estado", "fechaFin");

-- CreateIndex
CREATE INDEX "Pago_membresiaId_idx" ON "Pago"("membresiaId");

-- CreateIndex
CREATE INDEX "Rutina_profesorId_idx" ON "Rutina"("profesorId");

-- CreateIndex
CREATE INDEX "Rutina_socioId_idx" ON "Rutina"("socioId");

-- CreateIndex
CREATE INDEX "Ejercicio_grupoMuscular_idx" ON "Ejercicio"("grupoMuscular");

-- CreateIndex
CREATE INDEX "RutinaEjercicio_ejercicioId_idx" ON "RutinaEjercicio"("ejercicioId");

-- CreateIndex
CREATE UNIQUE INDEX "RutinaEjercicio_rutinaId_ejercicioId_key" ON "RutinaEjercicio"("rutinaId", "ejercicioId");

-- CreateIndex
CREATE INDEX "Clase_profesorId_idx" ON "Clase"("profesorId");

-- CreateIndex
CREATE INDEX "Clase_inicio_idx" ON "Clase"("inicio");

-- CreateIndex
CREATE INDEX "Reserva_claseId_idx" ON "Reserva"("claseId");

-- CreateIndex
CREATE INDEX "Reserva_fecha_idx" ON "Reserva"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_socioId_claseId_key" ON "Reserva"("socioId", "claseId");

-- CreateIndex
CREATE INDEX "Visita_socioId_idx" ON "Visita"("socioId");

-- CreateIndex
CREATE INDEX "Visita_ingresoAt_idx" ON "Visita"("ingresoAt");

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_membresiaId_fkey" FOREIGN KEY ("membresiaId") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutinaEjercicio" ADD CONSTRAINT "RutinaEjercicio_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "Rutina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutinaEjercicio" ADD CONSTRAINT "RutinaEjercicio_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "Ejercicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clase" ADD CONSTRAINT "Clase_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
