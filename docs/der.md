# Diagrama entidad-relación

Modelo de datos del gimnasio, generado a partir de `prisma/schema.prisma`. Si el
schema cambia, este diagrama se actualiza en el mismo PR.

`Socio` y `Profesor` no son tablas: son el mismo `User` diferenciado por su
campo `rol` (spec §3). Por eso `User` aparece en varias relaciones con etiquetas
distintas según el rol con el que participa.

```mermaid
erDiagram
    User ||--o{ Membresia : ""
    Plan ||--o{ Membresia : "define"
    Membresia ||--o{ Pago : "se paga con"

    User ||--o{ Rutina : "socio recibe"
    User ||--o{ Rutina : "profesor crea"
    Rutina ||--o{ RutinaEjercicio : "incluye"
    Ejercicio ||--o{ RutinaEjercicio : "aparece en"

    User ||--o{ Clase : "profesor dicta"
    User ||--o{ Reserva : "reserva"
    Clase ||--o{ Reserva : "recibe"

    User ||--o{ Visita : "registra"

    User {
        string id PK
        string email UK
        string nombre
        enum rol "ADMIN | PROFESOR | SOCIO"
        datetime createdAt
        datetime updatedAt
    }

    Plan {
        string id PK
        string nombre UK
        string descripcion
        decimal precio "10,2"
        int duracionDias
        boolean activo
    }

    Membresia {
        string id PK
        string socioId FK
        string planId FK
        datetime fechaInicio
        datetime fechaFin
        enum estado "ACTIVA | CANCELADA"
    }

    Pago {
        string id PK
        string membresiaId FK
        decimal monto "10,2"
        datetime fecha
        enum medio "EFECTIVO | MP"
        enum estado "APROBADO | PENDIENTE | RECHAZADO"
        string refExterna "id de la transaccion en Mercado Pago"
    }

    Rutina {
        string id PK
        string profesorId FK
        string socioId FK
        string nombre
        string objetivo
    }

    Ejercicio {
        string id PK
        string nombre UK
        string grupoMuscular
        string descripcion
        string imagenUrl
    }

    RutinaEjercicio {
        string id PK
        string rutinaId FK
        string ejercicioId FK
        int series
        int repeticiones
        int descansoSeg
        int orden
    }

    Clase {
        string id PK
        string profesorId FK
        string nombre
        int cupoMaximo
        datetime inicio
        int duracionMin
        string sala
    }

    Reserva {
        string id PK
        string socioId FK
        string claseId FK
        enum estado "CONFIRMADA | CANCELADA"
        boolean presente "la asistencia de H6 vive aca"
    }

    Visita {
        string id PK
        string socioId FK
        datetime ingresoAt
        datetime egresoAt
        enum estado "ABIERTA | CERRADA | INCOMPLETA"
    }
```

## Relaciones N-N

Las dos N-N del requisito de la cátedra se resuelven con una entidad puente que
lleva sus propios atributos:

| N-N | Puente | Qué atributos propios tiene |
|---|---|---|
| Rutina ↔ Ejercicio | `RutinaEjercicio` | `series`, `repeticiones`, `descansoSeg`, `orden` |
| Socio ↔ Clase | `Reserva` | `estado`, `presente` (la asistencia) |

## Restricciones que el diagrama no muestra

**Unicidad simple:** `User.email`, `Plan.nombre`, `Ejercicio.nombre`, y
`RutinaEjercicio (rutinaId, ejercicioId)` — un ejercicio no se repite dos veces
en la misma rutina.

**Índices únicos parciales** (SQL a mano en la migración, Prisma no los
expresa). Son reglas de negocio, no detalles de implementación:

- `Reserva (socioId, claseId) WHERE estado = 'CONFIRMADA'` — un socio no repite
  una clase, pero **sí puede volver a reservar después de cancelar**. Un
  `@@unique` simple rompería el flujo de cancelación de la spec §6.
- `Visita (socioId) WHERE estado = 'ABIERTA'` — una sola visita abierta por
  socio, que es lo que asume el flujo del QR.

**Borrado:** `onDelete: Restrict` en todo lo que es historial de negocio
(membresías, pagos, visitas, reservas, rutinas, clases): no se borra un socio
con historial. La única cascada es `RutinaEjercicio → Rutina`, porque un ítem de
rutina no tiene sentido sin su rutina.

## Datos que NO están en el modelo a propósito

Dos cosas que alguien podría esperar como columna y se calculan al leer. Es el
criterio de la clase 3: *si el dato puede cambiar sin que nadie toque el
sistema, se calcula; guardarlo es guardar una mentira con fecha de vencimiento.*

| Dato | Por qué no se guarda | Dónde se calcula |
|---|---|---|
| `VENCIDA` como estado de la membresía | Se vence sola cuando pasa `fechaFin`, sin que nadie abra la app. Guardarla exigiría un proceso que recorra la tabla corrigiéndola, y hasta que corra la columna miente | `estadoMembresiaVista()` en `lib/membresia.ts` — [ADR 0002](adr/0002-estado-membresia.md) |
| `duracionMin` de la visita | Es `egresoAt - ingresoAt`. Si un admin corrige el egreso a mano, una duración guardada queda mintiendo | `calcularDuracionMin()` en `lib/visita.ts` — [ADR 0003](adr/0003-duracion-visita.md) |

Las membresías `CANCELADA` y las reservas/visitas con su estado **sí** se
guardan: son hechos que alguien realizó, no conclusiones del paso del tiempo.
