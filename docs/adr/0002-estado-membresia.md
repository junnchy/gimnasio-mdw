# ADR 0002 — El estado VENCIDA de la membresía se calcula, no se guarda

**Estado:** aceptado
**Fecha:** 2026-08-25
**Decide:** equipo (clase 3, review del modelo de datos)

---

## Contexto

La spec §6 dice: *"La membresía pasa a VENCIDA automáticamente cuando la fecha de fin es anterior a hoy"*. La clase 3 define la regla para decidir si un estado se guarda o se calcula:

> ¿Este dato puede cambiar sin que NADIE toque el sistema?
> SÍ → se calcula. Guardarlo es guardar una mentira con fecha de vencimiento.
> NO → se guarda. Es un hecho que ocurrió.

`VENCIDA` cambia sola, el día que pasa la `fechaFin`, sin que nadie abra la aplicación. El estado de la clase 2 lo guardaba como columna, lo que obligaría a un proceso que recorra la tabla corrigiéndolo — y hasta que ese proceso corra, la columna estaría mintiendo.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| Guardar `ACTIVA`/`VENCIDA`/`CANCELADA` en la columna `estado` | Lectura directa sin calcular | `VENCIDA` queda desactualizado solo; requiere un proceso de corrección que suele no existir o fallar en silencio |
| Guardar solo los hechos (`ACTIVA`, `CANCELADA`) y calcular `VENCIDA` | `VENCIDA` nunca miente; coincide con el criterio de la clase 3 | Cada lectura de estado compara `fechaFin` con hoy (costo trivial con `@@index([fechaFin])`) |

## Decisión

Elegimos **guardar solo los hechos** y calcular `VENCIDA` al leer.

- `ACTIVA` y `CANCELADA` son actos que alguien realizó (un pago aprobado, una cancelación): se guardan.
- `VENCIDA` es una conclusión que se saca de `fechaFin` vs. hoy: se calcula.
- El `enum EstadoMembresia` de Prisma y el `estadoMembresia` de Zod quedan con dos valores, así el contrato de entrada y la base dan el mismo resultado (regla de la clase 3).

## Consecuencias

- Más fácil: el estado nunca queda mintiendo; no hay proceso de "cierre de membresías".
- Más difícil: el código que muestre el estado (H8) tiene que calcular `VENCIDA` al leer; se apoya en `@@index([fechaFin])`.
- Hay que revisar si aparece algún flujo que necesite guardar `VENCIDA` como hecho (ej. reportes que congelen el estado de un momento dado): ahí sería un campo aparte, no esta columna.