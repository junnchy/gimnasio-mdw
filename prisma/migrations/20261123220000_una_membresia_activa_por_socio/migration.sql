-- Un socio no puede tener más de una membresía ACTIVA a la vez (spec §6).
-- Lo hace cumplir la base, no un `if` (AGENTS.md, clase 14): dos personas de
-- recepción asignando un plan al mismo tiempo, o dos pestañas, no pueden
-- dejar dos ACTIVAS. Prisma no expresa índices parciales: va a mano, como
-- `Reserva_socio_clase_confirmada_key` y `Visita_socio_abierta_key`.
--
-- VENCIDA no se guarda (ADR 0002): una membresía vencida sigue ACTIVA en la
-- base y ocupa la clave. Para extenderla se registra un pago (H7); para darle
-- otro plan, primero se cancela. Una CANCELADA no ocupa la clave.

-- Antes del índice: los datos de demo anteriores a esta migración podían
-- dejar a un socio con más de una ACTIVA (renovaban creando otra). Se queda la
-- de `fechaFin` más lejana —la que ya muestran todas las pantallas como la
-- actual (H8)— y las demás pasan a CANCELADA. Sin esto, crear el índice
-- fallaría en una base que ya tiene duplicados. Los pagos no se tocan.
UPDATE "Membresia" AS m
SET "estado" = 'CANCELADA', "updatedAt" = CURRENT_TIMESTAMP
WHERE m."estado" = 'ACTIVA'
  AND EXISTS (
    SELECT 1 FROM "Membresia" AS otra
    WHERE otra."socioId" = m."socioId"
      AND otra."estado" = 'ACTIVA'
      AND (otra."fechaFin" > m."fechaFin" OR (otra."fechaFin" = m."fechaFin" AND otra."id" > m."id"))
  );

CREATE UNIQUE INDEX "Membresia_socio_activa_key"
ON "Membresia"("socioId") WHERE "estado" = 'ACTIVA';
