-- Reemplaza las entidades de ejemplo por el modelo que define docs/spec.md.
DROP TABLE "Nota";

CREATE TYPE "Rol_new" AS ENUM ('ADMIN', 'PROFESOR', 'SOCIO');
ALTER TABLE "Usuario" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "Usuario"
  ALTER COLUMN "rol" TYPE "Rol_new"
  USING CASE WHEN "rol"::text = 'USUARIO' THEN 'SOCIO'::"Rol_new" ELSE "rol"::text::"Rol_new" END;
DROP TYPE "Rol";
ALTER TYPE "Rol_new" RENAME TO "Rol";
ALTER TABLE "Usuario" ALTER COLUMN "rol" SET DEFAULT 'SOCIO';

CREATE TYPE "EstadoMembresia" AS ENUM ('ACTIVA', 'VENCIDA', 'CANCELADA');
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'MP');
CREATE TYPE "EstadoPago" AS ENUM ('APROBADO', 'PENDIENTE', 'RECHAZADO');
CREATE TYPE "EstadoReserva" AS ENUM ('CONFIRMADA', 'CANCELADA');
CREATE TYPE "EstadoVisita" AS ENUM ('ABIERTA', 'CERRADA', 'INCOMPLETA');

CREATE TABLE "Plan" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "precio" DECIMAL(12,2) NOT NULL,
  "duracionDias" INTEGER NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membresia" (
  "id" TEXT NOT NULL,
  "fechaInicio" TIMESTAMP(3) NOT NULL,
  "fechaFin" TIMESTAMP(3) NOT NULL,
  "estado" "EstadoMembresia" NOT NULL DEFAULT 'ACTIVA',
  "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "socioId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  CONSTRAINT "Membresia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pago" (
  "id" TEXT NOT NULL,
  "monto" DECIMAL(12,2) NOT NULL,
  "fecha" TIMESTAMP(3) NOT NULL,
  "medio" "MedioPago" NOT NULL,
  "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
  "refExterna" TEXT,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "membresiaId" TEXT NOT NULL,
  CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Clase" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "cupoMaximo" INTEGER NOT NULL,
  "inicio" TIMESTAMP(3) NOT NULL,
  "duracionMin" INTEGER NOT NULL,
  "sala" TEXT,
  "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "profesorId" TEXT NOT NULL,
  CONSTRAINT "Clase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reserva" (
  "id" TEXT NOT NULL,
  "estado" "EstadoReserva" NOT NULL DEFAULT 'CONFIRMADA',
  "presente" BOOLEAN NOT NULL DEFAULT false,
  "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "socioId" TEXT NOT NULL,
  "claseId" TEXT NOT NULL,
  CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Visita" (
  "id" TEXT NOT NULL,
  "ingresoAt" TIMESTAMP(3) NOT NULL,
  "egresoAt" TIMESTAMP(3),
  "estado" "EstadoVisita" NOT NULL DEFAULT 'ABIERTA',
  "duracionMin" INTEGER,
  "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "socioId" TEXT NOT NULL,
  CONSTRAINT "Visita_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rutina" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "objetivo" TEXT,
  "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadaEn" TIMESTAMP(3) NOT NULL,
  "profesorId" TEXT NOT NULL,
  "socioId" TEXT NOT NULL,
  CONSTRAINT "Rutina_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ejercicio" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "grupoMuscular" TEXT NOT NULL,
  "descripcion" TEXT,
  "imagenUrl" TEXT,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ejercicio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RutinaEjercicio" (
  "id" TEXT NOT NULL,
  "series" INTEGER NOT NULL,
  "repeticiones" INTEGER NOT NULL,
  "descansoSeg" INTEGER NOT NULL,
  "orden" INTEGER NOT NULL,
  "rutinaId" TEXT NOT NULL,
  "ejercicioId" TEXT NOT NULL,
  CONSTRAINT "RutinaEjercicio_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Membresia_socioId_fechaFin_idx" ON "Membresia"("socioId", "fechaFin");
CREATE UNIQUE INDEX "Plan_nombre_key" ON "Plan"("nombre");
CREATE INDEX "Membresia_planId_idx" ON "Membresia"("planId");
CREATE INDEX "Pago_membresiaId_idx" ON "Pago"("membresiaId");
CREATE INDEX "Clase_profesorId_inicio_idx" ON "Clase"("profesorId", "inicio");
CREATE INDEX "Clase_inicio_idx" ON "Clase"("inicio");
CREATE UNIQUE INDEX "Reserva_socioId_claseId_key" ON "Reserva"("socioId", "claseId");
CREATE INDEX "Reserva_claseId_estado_idx" ON "Reserva"("claseId", "estado");
CREATE INDEX "Reserva_socioId_estado_idx" ON "Reserva"("socioId", "estado");
CREATE INDEX "Visita_socioId_estado_idx" ON "Visita"("socioId", "estado");
CREATE INDEX "Visita_ingresoAt_idx" ON "Visita"("ingresoAt");
CREATE INDEX "Rutina_profesorId_idx" ON "Rutina"("profesorId");
CREATE INDEX "Rutina_socioId_idx" ON "Rutina"("socioId");
CREATE UNIQUE INDEX "Ejercicio_nombre_grupoMuscular_key" ON "Ejercicio"("nombre", "grupoMuscular");
CREATE UNIQUE INDEX "RutinaEjercicio_rutinaId_orden_key" ON "RutinaEjercicio"("rutinaId", "orden");
CREATE INDEX "RutinaEjercicio_ejercicioId_idx" ON "RutinaEjercicio"("ejercicioId");

ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_membresiaId_fkey" FOREIGN KEY ("membresiaId") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Clase" ADD CONSTRAINT "Clase_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RutinaEjercicio" ADD CONSTRAINT "RutinaEjercicio_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "Rutina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RutinaEjercicio" ADD CONSTRAINT "RutinaEjercicio_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "Ejercicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
