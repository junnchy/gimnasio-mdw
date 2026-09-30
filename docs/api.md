# Contrato de la API — Gimnasio MDW

Cada operación nace de una historia de `docs/spec.md`. Las rutas usan sustantivos
en plural; las transiciones de negocio son subrecursos porque el servidor —no el
cliente— decide si el cambio de estado corresponde.

Desde la clase 6 todos los endpoints piden sesión (Auth.js con Google), salvo
los dos marcados como públicos a propósito. El rol y el id de quien llama salen
**siempre** de la sesión: ningún `socioId`, `profesorId` ni `rol` se acepta del
body, del query ni de un header.

## Matriz de permisos

Cada celda es una línea de código. **401**: no hay sesión. **403**: hay sesión,
pero el rol no alcanza. **propias**: puede, pero la consulta lleva su id en el
WHERE, y lo ajeno responde 404 como si no existiera.

| Operación | Sin sesión | Socio | Profesor | Admin |
|---|---|---|---|---|
| Planes: listar, crear, corregir | 401 | 403 | 403 | ✓ |
| Asignar membresía, registrar pago | 401 | 403 | 403 | ✓ |
| Mi membresía | 401 | ✓ propia | 403 | 403 |
| Ver clases (listado y detalle) | 401 | ✓ | ✓ | ✓ |
| Programar clase | 401 | 403 | ✓ | 403 |
| Corregir clase | 401 | 403 | ✓ propias | 403 |
| Mis reservas, reservar, cancelar | 401 | ✓ propias | 403 | 403 |
| Marcar asistencia | 401 | 403 | ✓ de sus clases (403 si la clase es de otro) | 403 |
| Mis visitas, escanear QR | 401 | ✓ propias | 403 | 403 |
| Mis rutinas | 401 | ✓ propias | 403 | 403 |
| Crear rutina para un socio | 401 | 403 | ✓ | 403 |
| Corregir rutina, agregarle ejercicios | 401 | 403 | ✓ propias | 403 |
| Catálogo de ejercicios: ver y agregar | 401 | 403 | ✓ | 403 |
| Cierre diario de visitas | secreto `x-cron-secret` (lo llama un proceso, no una persona) | | | |
| `/api/auth/*` (login, logout, callback) | público a propósito | | | |

Los roles no se auto-asignan: quien entra con Google por primera vez nace
**SOCIO**, y PROFESOR o ADMIN solo se asignan en la base (ADR 0004).

## Planes

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/planes` | Lista planes de membresía | Admin | 400, 401, 403 |
| `POST /api/planes` | Crea un plan | Admin | 400, 401, 403, 409 |
| `PATCH /api/planes/:id` | Corrige un plan | Admin | 400, 401, 403, 404, 409 |

El `409` evita duplicar un nombre de plan. No se borra un plan con membresías:
se lo desactiva para conservar el historial.

## Membresías y pagos

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/membresias/mia` | Devuelve estado y vencimiento propios | Socio | 401, 403, 404 |
| `POST /api/membresias` | Asigna una membresía a un socio | Admin | 400, 401, 403, 404 |
| `POST /api/pagos` | Registra un intento de pago | Admin | 400, 401, 403, 404, 409 |

Un pago aprobado crea el pago y renueva la membresía en una transacción. Un pago
rechazado conserva el intento pero no activa la membresía.

## Clases y reservas

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/clases` | Lista clases programadas | Socio, Profesor, Admin | 400, 401 |
| `GET /api/clases/:id` | Detalle de una clase | Socio, Profesor, Admin | 401, 404 |
| `POST /api/clases` | Programa una clase | Profesor | 400, 401, 403 |
| `PATCH /api/clases/:id` | Corrige una clase propia | Profesor | 400, 401, 403, 404 |
| `GET /api/reservas` | Lista reservas propias | Socio | 400, 401, 403 |
| `POST /api/reservas` | Reserva una clase | Socio | 400, 401, 403, 404, 409 |
| `POST /api/reservas/:id/cancelacion` | Cancela una reserva propia | Socio | 401, 403, 404, 409 |
| `POST /api/reservas/:id/asistencia` | Marca presencia | Profesor de la clase | 401, 403, 404, 409 |

Los `409` de reserva cubren membresía vencida, cupo agotado, duplicado u horario
solapado. La cancelación solo admite una reserva confirmada y futura; asistencia,
una confirmada de una clase ya dictada.

## Visitas por QR

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/visitas` | Lista visitas propias | Socio | 400, 401, 403 |
| `POST /api/visitas/escaneos` | Abre o cierra la visita según exista una abierta | Socio | 400, 401, 403, 409 |
| `POST /api/visitas/cierre-diario` | Marca incompletas las visitas abiertas del día | Proceso programado con `x-cron-secret` | 401 |

El escaneo recibe el token QR, no el `socioId`: el socio siempre sale de la
sesión. Devuelve `409` para membresía vencida, QR inválido o un segundo escaneo
en menos de 60 segundos.

## Rutinas y ejercicios

| Método y ruta | Qué hace | Rol | Errores |
|---|---|---|---|
| `GET /api/rutinas/mia` | Devuelve las rutinas asignadas | Socio | 400, 401, 403 |
| `POST /api/rutinas` | Crea una rutina para un socio | Profesor | 400, 401, 403, 404 |
| `PATCH /api/rutinas/:id` | Corrige una rutina propia | Profesor | 400, 401, 403, 404 |
| `POST /api/rutinas/:id/ejercicios` | Agrega un ejercicio a la rutina | Profesor | 400, 401, 403, 404, 409 |
| `GET /api/ejercicios` | Lista el catálogo de ejercicios | Profesor | 400, 401, 403 |
| `POST /api/ejercicios` | Agrega un ejercicio al catálogo | Profesor | 400, 401, 403, 409 |

`409` representa un ejercicio ya existente en la rutina o un nombre ya existente
en el catálogo. La posición (`orden`) se conserva como dato de presentación y no
es una restricción de unicidad.

## Catálogo de errores

Cada fila sale de un criterio de aceptación de `docs/spec.md`. La columna
**Capa** dice quién lo detecta, que es lo que determina el código:

- **Zod** (`route.ts`): la estructura del request → `400`. El cliente lo arregla mandando otros datos.
- **Regla** (`lib/*.ts`, funciones puras): el estado del sistema no lo permite → `409`.
- **Base** (constraints de Prisma): integridad, y carrera entre dos requests → `404`/`409`.
- **Sesión** (clase 6): quién llama → `401`/`403`.

El `409` devuelve `{ error, motivos: [{ codigo, mensaje, datos }] }`: el mensaje
es para la persona y `motivos` para el front, que así no tiene que parsear texto.
Cuando fallan varias reglas a la vez, vienen todas.

### Visitas por QR

| Operación | Situación | Capa | Status | Mensaje |
|---|---|---|---|---|
| `POST /api/visitas/escaneos` | Falta el `qrToken` o tiene menos de 10 caracteres | Zod | 400 | Datos inválidos |
| `POST /api/visitas/escaneos` | H1: el QR no es el de la puerta | Regla `QR_INVALIDO` | 409 | QR inválido o vencido. |
| `POST /api/visitas/escaneos` | H1: la membresía está VENCIDA o CANCELADA **y el escaneo es un ingreso**. Al egreso no aplica: H2 no le pone condición de membresía, y a un socio que está adentro hay que dejarlo salir | Regla `MEMBRESIA_INACTIVA` | 409 | Membresía vencida: no se puede registrar el ingreso. |
| `POST /api/visitas/escaneos` | H2: segundo escaneo antes de los 60 segundos | Regla `ESCANEO_DUPLICADO` | 409 | Escaneo repetido: esperá unos segundos. |
| `POST /api/visitas/escaneos` | Dos escaneos simultáneos pasan el debounce y chocan con el único parcial | Base `VISITA_ABIERTA_DUPLICADA` | 409 | Ya tenés una visita abierta. |
| `POST /api/visitas/cierre-diario` | H3: falta o no coincide `x-cron-secret` | Sesión | 401 | No autorizado |

### Reservas

| Operación | Situación | Capa | Status | Mensaje |
|---|---|---|---|---|
| `POST /api/reservas` | Falta `claseId` | Zod | 400 | Datos inválidos |
| `POST /api/reservas` | La clase no existe | Base | 404 | Clase no encontrada |
| `POST /api/reservas` | H4: la membresía no está ACTIVA | Regla `MEMBRESIA_INACTIVA` | 409 | Tu membresía no está activa: no podés reservar clases. |
| `POST /api/reservas` | H4: la clase no tiene cupo | Regla `SIN_CUPO` | 409 | Sin cupo disponible. |
| `POST /api/reservas` | H4: ya tiene una reserva en el mismo horario | Regla `HORARIO_SOLAPADO` | 409 | Ya tenés una reserva en ese horario: `<clases>`. |
| `POST /api/reservas` | Derivado de H5: la clase ya empezó | Regla `CLASE_YA_INICIADA` | 409 | La clase ya empezó: no se puede reservar. |
| `POST /api/reservas` | Dos requests simultáneos para la misma clase | Base `RESERVA_DUPLICADA` | 409 | Ya tenés una reserva confirmada para esta clase. |
| `POST /api/reservas/:id/cancelacion` | La reserva no existe, o es de otro socio | Base | 404 | Reserva no encontrada |
| `POST /api/reservas/:id/cancelacion` | H5: la reserva ya está CANCELADA | Regla `RESERVA_NO_CONFIRMADA` | 409 | La reserva no está confirmada. |
| `POST /api/reservas/:id/cancelacion` | H5: la clase ya empezó | Regla `CLASE_YA_INICIADA` | 409 | La clase ya empezó: no se puede cancelar. |
| `POST /api/reservas/:id/asistencia` | La reserva no existe | Base | 404 | Reserva no encontrada |
| `POST /api/reservas/:id/asistencia` | La reserva existe pero la clase es de otro profesor | Sesión | 403 | La clase no es tuya |
| `POST /api/reservas/:id/asistencia` | H6: la reserva está CANCELADA | Regla `RESERVA_NO_CONFIRMADA` | 409 | No se puede marcar asistencia sobre una reserva cancelada. |
| `POST /api/reservas/:id/asistencia` | H6: la clase todavía no terminó | Regla `CLASE_NO_DICTADA` | 409 | La clase todavía no terminó: no se puede marcar asistencia. |

### Membresías y pagos

| Operación | Situación | Capa | Status | Mensaje |
|---|---|---|---|---|
| `GET /api/membresias/mia` | H8: el socio no tiene ninguna membresía | Base | 404 | Membresía no encontrada |
| `POST /api/membresias` | `fechaFin` anterior o igual a `fechaInicio` | Zod | 400 | Datos inválidos |
| `POST /api/membresias` | El socio o el plan no existen | Base | 404 | Socio o plan no encontrado |
| `POST /api/pagos` | `monto` negativo, `medio` fuera del enum o fecha inválida | Zod | 400 | Datos inválidos |
| `POST /api/pagos` | La membresía no existe | Base | 404 | Membresía no encontrada |
| `POST /api/pagos` | La membresía está CANCELADA (ADR 0002: cancelar es un hecho) | Regla `MEMBRESIA_CANCELADA` | 409 | La membresía está cancelada: hay que crear una nueva. |

### Planes, clases, rutinas y ejercicios

| Operación | Situación | Capa | Status | Mensaje |
|---|---|---|---|---|
| `POST /api/planes` | Nombre de plan repetido | Base | 409 | Ya existe un plan con ese nombre |
| `PATCH /api/planes/:id` | El plan no existe | Base | 404 | No encontrado |
| `GET` de cualquier listado | `?limite=` fuera de 1–100 | Zod | 400 | Parámetros inválidos |
| `POST /api/ejercicios` | Nombre de ejercicio repetido | Base | 409 | Ya existe un ejercicio con ese nombre |
| `POST /api/rutinas` | El socio no existe | Base | 404 | Socio no encontrado |
| `POST /api/rutinas/:id/ejercicios` | El ejercicio ya está en la rutina | Base | 409 | El ejercicio ya está en esta rutina |
| Cualquier operación salvo las públicas | No hay sesión | Sesión (`requerirUsuario`) | 401 | No autenticado |
| Cualquier operación con rol | La sesión es de otro rol (matriz de arriba) | Sesión (`requerirUsuario("ROL")`) | 403 | No podés realizar esta operación |
| Operaciones sobre datos propios | El recurso es de otro usuario | Base (id de la sesión en el WHERE) | 404 | El mismo mensaje que "no existe" |
| Cualquier operación | Falla inesperada del sistema | — | 500 | Error interno |

**400 vs 409:** si el cliente lo arregla mandando otros datos, es 400; si primero
tiene que cambiar el estado del sistema (pagar la cuota, que alguien libere un
cupo, esperar que termine la clase), es 409.

**404 vs 403:** una reserva de otro socio responde 404, no 403, para no revelar
que el id existe. En cambio marcar asistencia sobre una reserva de la clase de
otro profesor responde 403: el recurso es visible, lo que falta es el permiso.

## Qué está implementado hoy

| Clase | Qué está listo |
|---|---|
| 4 | Todos los endpoints del contrato, sus módulos en `lib/db/`, validación Zod y pruebas en `docs/api.http`. Hasta Auth.js se usaba el usuario de ejemplo del seed (reemplazado en la clase 6). |
| 5 | Reglas de conflicto implementadas como funciones puras en `lib/` (membresía activa, cupo, solapamiento, QR y debounce, cancelación fuera de término, clase ya dictada, renovación atómica del pago), con el catálogo de errores de arriba y su request en `docs/api.http`. |
| 6 | Login con Google (Auth.js, sesión JWT). Cada endpoint exige sesión y rol según la matriz, con `requerirUsuario`; las consultas de datos propios llevan el id de la sesión en el WHERE; `401`/`403`/`500` se traducen en un solo lugar (`responderError`). Se borró el usuario de ejemplo. Los tres casos están al principio de `docs/api.http`. |
