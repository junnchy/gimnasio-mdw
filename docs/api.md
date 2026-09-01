# Contrato de la API — Gimnasio MDW

Cada operación nace de una historia de `docs/spec.md`. Las rutas usan sustantivos
en plural; las transiciones de negocio son subrecursos porque el servidor —no el
cliente— decide si el cambio de estado corresponde.

Hasta la clase 6 los handlers dejan documentado el `TODO` de sesión. El contrato
ya incluye los `401` y permisos finales.

## Planes

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/planes` | Lista planes de membresía | Admin | 401 |
| `POST /api/planes` | Crea un plan | Admin | 400, 401, 409 |
| `PATCH /api/planes/:id` | Corrige un plan | Admin | 400, 401, 404 |

El `409` evita duplicar un nombre de plan. No se borra un plan con membresías:
se lo desactiva para conservar el historial.

## Membresías y pagos

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/membresias/mia` | Devuelve estado y vencimiento propios | Socio | 401 |
| `POST /api/membresias` | Asigna una membresía a un socio | Admin | 400, 401, 404 |
| `POST /api/pagos` | Registra un intento de pago | Admin | 400, 401, 404 |

Un pago aprobado crea el pago y renueva la membresía en una transacción. Un pago
rechazado conserva el intento pero no activa la membresía.

## Clases y reservas

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/clases` | Lista clases programadas | Socio, Profesor, Admin | 401 |
| `POST /api/clases` | Programa una clase | Profesor | 400, 401, 403 |
| `PATCH /api/clases/:id` | Corrige una clase propia | Profesor | 400, 401, 404 |
| `GET /api/reservas` | Lista reservas propias | Socio | 401 |
| `POST /api/reservas` | Reserva una clase | Socio | 400, 401, 404, 409 |
| `POST /api/reservas/:id/cancelacion` | Cancela una reserva propia | Socio | 401, 404, 409 |
| `POST /api/reservas/:id/asistencia` | Marca presencia | Profesor de la clase | 401, 403, 404, 409 |

Los `409` de reserva cubren membresía vencida, cupo agotado, duplicado u horario
solapado. La cancelación solo admite una reserva confirmada y futura; asistencia,
una confirmada de una clase ya dictada.

## Visitas por QR

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/visitas` | Lista visitas propias | Socio | 401 |
| `POST /api/visitas/escaneos` | Abre o cierra la visita según exista una abierta | Socio | 400, 401, 409 |
| `POST /api/visitas/cierre-diario` | Marca incompletas las visitas abiertas del día | Admin o proceso programado | 401, 403 |

El escaneo recibe el token QR, no el `socioId`: el socio siempre sale de la
sesión. Devuelve `409` para membresía vencida, QR inválido o un segundo escaneo
en menos de 60 segundos.

## Rutinas y ejercicios

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/rutinas/mia` | Devuelve las rutinas asignadas | Socio | 401 |
| `POST /api/rutinas` | Crea una rutina para un socio | Profesor | 400, 401, 403, 404 |
| `PATCH /api/rutinas/:id` | Corrige una rutina propia | Profesor | 400, 401, 404 |
| `POST /api/rutinas/:id/ejercicios` | Agrega un ejercicio a la rutina | Profesor | 400, 401, 403, 404, 409 |
| `GET /api/ejercicios` | Lista el catálogo de ejercicios | Profesor | 401, 403 |
| `POST /api/ejercicios` | Agrega un ejercicio al catálogo | Profesor | 400, 401, 403, 409 |

`409` representa una posición repetida dentro de la rutina o un ejercicio ya
existente en el catálogo.
