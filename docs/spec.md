# Especificación del sistema

> Este documento **es** el relevamiento de requerimientos del proyecto (eje metodológico, clase 2).
> Se completa en la clase 2 y se mantiene actualizado todo el cuatrimestre.
> Regla práctica: si una funcionalidad no está acá, no se implementa.

## 1. El problema

**Para quién:** dueños y personal de un gimnasio, y sus socios.
**Qué hace hoy sin el sistema:** gestionan socios, cuotas, rutinas, clases y el control de acceso con planillas, papel y WhatsApp; no hay registro confiable de quién entra y sale ni de las cuotas vencidas.
**Qué mejora:** centraliza la gestión del gym en una PWA, controla cuotas y cupos, y registra las visitas por QR para tener datos reales de uso.

## 2. Roles

| Rol | Quién es | Qué puede hacer que el otro no |
|---|---|---|
| ADMIN | Dueño / recepción del gym | Gestiona planes, socios, membresías y pagos; registra pagos; ve reportes y ocupación |
| PROFESOR | Entrenador | Crea y asigna rutinas, dicta clases y marca la asistencia en las reservas |
| SOCIO | Cliente del gym | Consulta su rutina y su cuota, reserva y cancela clases, y registra su visita por QR |

## 3. Entidades

Los sustantivos que aparecen en las historias de usuario. De acá sale el modelo de datos.

| Entidad | Qué representa | Se relaciona con |
|---|---|---|
| Plan | Plan de membresía (precio, duración) | Membresia (1-N) |
| Membresia | Suscripción de un socio a un plan | Plan (N-1), Socio (N-1), Pago (1-N) |
| Pago | Pago de una cuota | Membresia (N-1) |
| Rutina | Rutina de entrenamiento de un socio | Profesor (N-1), Socio (N-1), Ejercicio (N-N vía RutinaEjercicio) |
| Ejercicio | Catálogo de ejercicios | Rutina (N-N vía RutinaEjercicio) |
| RutinaEjercicio | Un ejercicio dentro de una rutina (series, reps, descanso) | Rutina (N-1), Ejercicio (N-1) |
| Clase | Clase grupal con cupo y horario | Profesor (N-1), Reserva (1-N) |
| Reserva | Reserva de un socio a una clase; incluye la asistencia (`presente`) | Socio (N-1), Clase (N-1) |
| Visita | Ingreso/egreso general al gym por escaneo de QR | Socio (N-1) |

> `Socio` y `Profesor` son un mismo `User` diferenciado por su `rol`. La asistencia a clase se modela como el campo `presente` de **Reserva** (no como entidad aparte).

## 4. Historias de usuario

Formato: **Como** <rol>, **quiero** <acción>, **para** <beneficio>.
Cada historia lleva su criterio de aceptación: cómo se verifica que está terminada.

### H1 — Registrar ingreso al gym
**Como** socio, **quiero** registrar mi ingreso escaneando el QR de la puerta, **para** dejar constancia de mi visita.

Criterios de aceptación:
- [ ] Dado un socio logueado con membresía ACTIVA y sin visita abierta, cuando escanea el QR válido, entonces se crea una Visita con ingreso = ahora y estado ABIERTA.
- [ ] Caso de error: cuando el socio tiene la membresía VENCIDA, el sistema rechaza el ingreso e informa "membresía vencida".
- [ ] Caso de error: cuando el QR es inválido o vencido, el sistema rechaza y no crea la visita.

### H2 — Registrar egreso del gym
**Como** socio, **quiero** registrar mi salida con el mismo QR, **para** que se calcule cuánto estuve.

Criterios de aceptación:
- [ ] Dado un socio con una visita ABIERTA, cuando escanea el QR, entonces se cierra la visita (egreso = ahora, estado CERRADA) y se muestra la duración.
- [ ] Caso de error: cuando llega un segundo escaneo en menos de 60 segundos, el sistema lo ignora (debounce).

### H3 — Cierre automático de visitas olvidadas
**Como** admin, **quiero** que las visitas sin salida se cierren solas, **para** no ensuciar las métricas.

Criterios de aceptación:
- [ ] Dado una visita ABIERTA al cierre del día, cuando corre el proceso, entonces la marca INCOMPLETA y no computa duración.

### H4 — Reservar una clase
**Como** socio, **quiero** reservar un lugar en una clase, **para** asegurarme el cupo.

Criterios de aceptación:
- [ ] Dado un socio con membresía ACTIVA y una clase con cupo, cuando confirma la reserva, entonces se crea la Reserva CONFIRMADA y se descuenta un cupo.
- [ ] Caso de error: cuando la clase no tiene cupo, el sistema rechaza con "sin cupo disponible".
- [ ] Caso de error: cuando el socio ya tiene una reserva en el mismo horario, el sistema rechaza por solapamiento.

### H5 — Cancelar una reserva
**Como** socio, **quiero** cancelar una reserva, **para** liberar el lugar si no voy.

Criterios de aceptación:
- [ ] Dado una reserva CONFIRMADA a futuro, cuando el socio la cancela, entonces se marca CANCELADA y se libera el cupo.

### H6 — Marcar asistencia a una clase
**Como** profesor, **quiero** marcar qué socios asistieron a mi clase, **para** llevar el control.

Criterios de aceptación:
- [ ] Dado una reserva CONFIRMADA de una clase ya dictada, cuando el profesor la marca como presente, entonces se setea `presente = true` en esa reserva.
- [ ] Caso de error: cuando la reserva está CANCELADA, el sistema no permite marcar asistencia.

### H7 — Registrar el pago de una cuota
**Como** admin, **quiero** registrar el pago de una cuota, **para** activar o renovar la membresía del socio.

Criterios de aceptación:
- [ ] Dado un socio con membresía VENCIDA, cuando el admin registra un pago aprobado, entonces se crea el Pago y la membresía pasa a ACTIVA con nueva fecha de vencimiento.
- [ ] Caso de error: cuando el pago es rechazado, la membresía NO se activa y queda constancia del intento.

### H8 — Consultar mi estado de cuota
**Como** socio, **quiero** ver si mi cuota está al día, **para** saber si puedo usar el gym.

Criterios de aceptación:
- [ ] Dado un socio logueado, cuando abre su panel, entonces ve el estado de su membresía (ACTIVA/CANCELADA son hechos guardados; VENCIDA se calcula al leer, ver ADR 0002) y la fecha de vencimiento.

## 5. Flujo principal

Registro de visita por QR (ingreso/egreso con lógica por estado):

1. El socio, logueado en la PWA, escanea el QR **fijo** de la puerta.
2. El servidor valida: socio autenticado, membresía ACTIVA, token del QR válido y (opcional) geolocalización dentro del gym.
3. Si el socio **no** tiene visita ABIERTA → crea una nueva (ingreso).
4. Si **ya** tiene una visita ABIERTA → la cierra y calcula la duración (egreso).
5. Las visitas ABIERTAS al cierre del día se marcan INCOMPLETA.
6. El dato alimenta reportes de ocupación por franja horaria, horarios pico y frecuencia/duración de visita por socio.

## 6. Reglas de negocio

Las restricciones que **no** son obvias y que la IA no puede adivinar. Estas son las que hay que revisar a mano.

- Solo socios con membresía ACTIVA pueden reservar clases y registrar ingreso.
- Un socio no puede tener más de una visita ABIERTA simultánea.
- Un socio no puede tener dos reservas en el mismo horario.
- La duración de una visita se calcula de `ingresoAt`/`egresoAt` al leer, nunca se guarda (ADR 0003); una visita INCOMPLETA no computa duración.
- El cupo de una clase nunca puede quedar negativo; una reserva CANCELADA libera cupo.
- La asistencia (`presente`) solo se puede marcar sobre una reserva CONFIRMADA.
- VENCIDA se calcula al leer la membresía (`fechaFin` anterior a hoy); nunca se guarda como estado. Decisión y precedencia en [ADR 0002](adr/0002-estado-membresia.md).
- Toda validación sensible (membresía, cupo, token del QR, geoloc) corre en el servidor.

## 7. Requisitos no funcionales

No son funcionalidades: son condiciones que todo el sistema tiene que cumplir. Se escriben ahora
porque al final del cuatrimestre ya no se pueden arreglar. En la **clase 10** se auditan contra lo
que hayan construido.

### Usabilidad

- **Eficiencia:** registrar el ingreso por QR se hace en 2 interacciones o menos (abrir cámara → escanear).
- **Errores:** si falta un campo obligatorio (ej. alta de socio), se señala el campo y no se pierde lo ya cargado.
- **Aprendizaje:** un socio que nunca vio el sistema registra su primera visita sin que le expliquen.
- **Recuerdo:** el escaneo de QR y "mis reservas" están a un clic desde la home y siempre en el mismo lugar.
- **Satisfacción:** se prueba con una persona de afuera del equipo antes del Demo Day.

### Accesibilidad

Esta lista es **igual para todos los proyectos**: no hay que adaptarla, hay que cumplirla.

- [ ] Todo se puede operar **con el teclado**, y se ve dónde está el foco.
- [ ] Los campos de formulario tienen `label` asociado, no solo *placeholder*.
- [ ] Las imágenes que informan tienen texto alternativo; las decorativas, alternativo vacío.
- [ ] El **contraste** entre texto y fondo llega a **4,5:1** (3:1 si la letra es grande).
- [ ] El error nunca se comunica **solo con color**: siempre hay texto.

## 8. Integración externa

**Cuál:** pagos (Mercado Pago).
**Para qué:** cobrar las cuotas de membresía online y actualizar automáticamente el estado del socio.

**Qué pasa si se cae**, por operación:

| Operación | Mercado Pago es… | Si Mercado Pago falla, el usuario ve… |
|---|---|---|
| Registrar un pago en EFECTIVO (`POST /api/pagos`, medio `EFECTIVO`) | No participa | Nada distinto: el pago se registra APROBADO y renueva la membresía (201). |
| Registrar un pago MP y generar el link de cobro (`POST /api/pagos`, medio `MP`) | **Esencial** | El admin ve un error 502: "Mercado Pago no está disponible en este momento. No es un problema de los datos cargados: probá de nuevo en unos minutos o registrá el pago en efectivo." **No se registra nada** en la base. |
| Confirmar un pago MP (`POST /api/pagos/webhook`) | **Esencial** | El pago sigue PENDIENTE y la membresía no se renueva. Nuestro sistema no reintenta solo: el pago se confirma recién cuando Mercado Pago vuelve a mandar la notificación y la consulta anda. |

Ningún cobro online se reintenta automáticamente: si la operación falla, el admin la vuelve a intentar.

**El EFECTIVO es un camino manual aparte**, no un reintento ni un modo de emergencia automático. Si Mercado Pago no anda y el socio no quiere esperar, el admin cobra en mano y registra un pago nuevo con medio EFECTIVO; así no se bloquea el acceso del socio.

## 9. Fuera de alcance

Lo que decidimos **no** hacer, para no volver a discutirlo en la clase 12.

- **Módulo de nutrición / dietas** (Dieta e ItemDieta): se recorta del MVP para enfocarnos en el núcleo del gym.
- **Asistencia como entidad separada**: se modela como el campo `presente` de Reserva.
- App nativa (iOS/Android): se entrega como **PWA**.
- QR rotativo con token firmado por hardware de recepción (el MVP usa QR fijo + socio logueado).
- Facturación electrónica / integración contable.
- Torniquete o control físico de acceso (molinete).
- Multi-sede: el MVP asume **un** gimnasio.
