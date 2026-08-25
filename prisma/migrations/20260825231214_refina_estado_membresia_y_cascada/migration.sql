/*
  Warnings:

  - The values [VENCIDA] on the enum `EstadoMembresia` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoMembresia_new" AS ENUM ('ACTIVA', 'CANCELADA');
ALTER TABLE "public"."Membresia" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Membresia" ALTER COLUMN "estado" TYPE "EstadoMembresia_new" USING ("estado"::text::"EstadoMembresia_new");
ALTER TYPE "EstadoMembresia" RENAME TO "EstadoMembresia_old";
ALTER TYPE "EstadoMembresia_new" RENAME TO "EstadoMembresia";
DROP TYPE "public"."EstadoMembresia_old";
ALTER TABLE "Membresia" ALTER COLUMN "estado" SET DEFAULT 'ACTIVA';
COMMIT;

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_claseId_fkey";

-- DropIndex
DROP INDEX "Membresia_estado_fechaFin_idx";

-- CreateIndex
CREATE INDEX "Membresia_fechaFin_idx" ON "Membresia"("fechaFin");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
