# ADR 0003 — La duración de la visita se calcula, no se guarda

**Estado:** aceptado
**Fecha:** 2026-08-25
**Decide:** equipo (review del PR de la clase 3)

---

## Contexto

`Visita.duracionMin` guardaba el resultado de `egresoAt - ingresoAt`. Es el mismo caso que resolvió el ADR 0002 para VENCIDA: es un dato derivado de dos hechos (`ingresoAt`, `egresoAt`), no un hecho en sí mismo.

La pregunta de la clase 3: *"¿Este dato puede cambiar sin que NADIE toque el sistema?"*. Si un admin corrige el `egresoAt` a mano, la duración guardada queda mintiendo — y no hay error ni pantalla roja que avise: es un número viejo que se ve perfectamente normal.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| Guardar `duracionMin` en la columna | Lectura directa, reportes rápidos | Se desactualiza solo si se corrige el egreso; requiere mantener el dato sincronizado |
| Calcularla al leer (`egresoAt - ingresoAt`) | Nunca miente; cero mantenimiento | Cada lectura hace una resta (costo trivial); las INCOMPLETA no computan |

## Decisión

Elegimos **calcularla al leer**. Se quita `duracionMin` de la tabla `Visita` y del schema Zod; la regla vive en `calcularDuracionMin()` en `lib/visita.ts` (con test en `lib/visita.test.ts`). Las visitas INCOMPLETA (sin `egresoAt`) no computan duración.

Se aplica el mismo criterio que en el ADR 0002: derivado → se calcula; hecho → se guarda.

## Consecuencias

- Más fácil: el dato nunca queda mintiendo; no hay proceso que lo sincronice.
- Más difícil: si mañana hay un reporte que necesita la duración sin leer cada visita, se evalúa desnormalizar en una tabla de reportes aparte, no volver a esta columna.
- Coherente con el ADR 0002: los dos campos derivados del dominio (estado VENCIDA y duración) se calculan con una única función cada uno, en `lib/`.
