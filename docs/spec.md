# Especificación — Administrador de Gimnasio

> Fuente de verdad del proyecto. Documenta **qué** hace el sistema, no el cómo.
> Regla: **si algo no está en esta spec, no se implementa.** Se mantiene durante todo el cuatrimestre.

## 1. Problema y beneficio

Los gimnasios gestionan socios, cuotas, rutinas, dietas, clases y el control de acceso de forma dispersa (planillas, papel, WhatsApp). Eso genera cuotas vencidas sin detectar, clases sin control de cupo y cero visibilidad de la ocupación real del local.

**Administrador de Gimnasio** centraliza todo en una web app (PWA) donde el **administrador** gestiona el negocio, el **profesor** arma y sigue el entrenamiento, y el **socio** consulta su plan, reserva clases y registra su ingreso/egreso escaneando un QR. Beneficio: menos tareas manuales, cuotas y cupos bajo control, y datos reales de uso del gym para tomar decisiones.

## 2. Roles

- **ADMIN** — gestiona planes, socios, membresías, pagos y clases; ve reportes y ocupación.
- **PROFESOR** — crea y asigna rutinas y dietas, dicta clases y registra asistencia a clase.
- **SOCIO** — consulta su rutina/dieta y su estado de cuota, reserva clases y registra su visita al gym por QR.

(Mínimo 2 requerido; usamos 3 para que los permisos sean distintos y significativos.)

## 3. Entidades (sustantivos del dominio)

1. **Plan** — plan de membresía (nombre, precio, duración, activo).
2. **Membresia** — suscripción de un socio a un plan (fechas, estado).
3. **Pago** — pago de una cuota (monto, fecha, medio, estado).
4. **Rutina** — rutina de entrenamiento (nombre, objetivo).
5. **Ejercicio** — catálogo de ejercicios (nombre, grupo muscular, imagen).
6. **RutinaEjercicio** — ejercicio dentro de una rutina (series, reps, descanso, orden).
7. **Dieta** — plan alimentario (nombre, objetivo, calorías objetivo).
8. **ItemDieta** — comida de una dieta (momento, descripción, calorías).
9. **Clase** — clase grupal (nombre, cupo máximo, inicio, duración).
10. **Reserva** — reserva de un socio a una clase (fecha, estado).
11. **Asistencia** — presencia registrada en una clase.
12. **Visita** — ingreso/egreso general al gym por QR (ingreso, egreso, estado, duración).

Relaciones clave: 1-N (Plan→Membresía, Socio→Pagos, Clase→Reservas, Socio→Visitas); N-N (Rutina↔Ejercicio vía RutinaEjercicio, Socio↔Clase vía Reserva).

## 4. User stories (con criterios de aceptación)

### US-1 — Registrar ingreso al gym
Como **socio**, quiero registrar mi ingreso escaneando el QR de la puerta, para dejar constancia de mi visita.
- **Given** socio logueado con membresía ACTIVA y sin visita abierta, **When** escanea el QR válido de la puerta, **Then** el sistema crea una Visita con ingreso = ahora y estado ABIERTA, y muestra confirmación.
- **Error — Given** socio con membresía VENCIDA, **When** escanea, **Then** el sistema rechaza el ingreso y muestra "membresía vencida".
- **Error — Given** un QR inválido o vencido, **When** escanea, **Then** el sistema rechaza y no crea la visita.

### US-2 — Registrar egreso del gym
Como **socio**, quiero registrar mi salida con el mismo QR, para que se calcule cuánto estuve.
- **Given** socio con una visita ABIERTA, **When** escanea el QR, **Then** el sistema la cierra (egreso = ahora, estado CERRADA) y muestra la duración.
- **Error — Given** dos escaneos en menos de 60 segundos, **When** llega el segundo, **Then** el sistema lo ignora (debounce).

### US-3 — Cierre automático de visitas olvidadas
Como **admin**, quiero que las visitas sin salida se cierren solas, para no ensuciar las métricas.
- **Given** una visita ABIERTA al cierre del día, **When** corre el proceso, **Then** la marca INCOMPLETA y no computa duración.

### US-4 — Reservar una clase
Como **socio**, quiero reservar un lugar en una clase, para asegurarme el cupo.
- **Given** socio con membresía ACTIVA y una clase con cupo disponible, **When** confirma la reserva, **Then** el sistema crea la Reserva CONFIRMADA y descuenta un cupo.
- **Error — Given** una clase sin cupo, **When** intenta reservar, **Then** el sistema rechaza con "sin cupo disponible".
- **Error — Given** el socio ya tiene una reserva en el mismo horario, **When** intenta reservar otra, **Then** el sistema rechaza por solapamiento.

### US-5 — Cancelar una reserva
Como **socio**, quiero cancelar una reserva, para liberar el lugar si no voy.
- **Given** una reserva CONFIRMADA a futuro, **When** el socio la cancela, **Then** el sistema la marca CANCELADA y libera el cupo.

### US-6 — Registrar el pago de una cuota
Como **admin**, quiero registrar el pago de una cuota, para activar o renovar la membresía del socio.
- **Given** un socio con membresía VENCIDA, **When** el admin registra un pago aprobado, **Then** el sistema crea el Pago y pasa la membresía a ACTIVA con nueva fecha de vencimiento.
- **Error — Given** un pago rechazado, **When** se registra, **Then** la membresía NO se activa y queda constancia del intento.

### US-7 — Consultar mi estado de cuota
Como **socio**, quiero ver si mi cuota está al día, para saber si puedo usar el gym.
- **Given** socio logueado, **When** abre su panel, **Then** ve el estado de su membresía (ACTIVA/VENCIDA) y la fecha de vencimiento.

## 5. Workflow principal (no es un ABM)

**Registro de visita por QR (ingreso/egreso con lógica por estado):**
1. El socio, logueado en la PWA, escanea el QR **fijo** de la puerta.
2. El **servidor** valida: socio autenticado, membresía ACTIVA, token del QR válido y (opcional) geolocalización dentro del gym.
3. Si el socio **no** tiene visita ABIERTA → crea una nueva (ingreso).
4. Si **ya** tiene una visita ABIERTA → la cierra y calcula la duración (egreso).
5. Las visitas ABIERTAS al cierre del día se marcan INCOMPLETA.

Este dato alimenta reportes de ocupación por franja horaria, horarios pico y frecuencia/duración de visita por socio.

## 6. Reglas de negocio (que la IA no puede inferir)

- Solo socios con membresía **ACTIVA** pueden reservar clases y registrar ingreso.
- Un socio **no puede tener más de una visita ABIERTA** simultánea.
- Un socio **no puede tener dos reservas en el mismo horario**.
- La **duración** de una visita se calcula solo cuando pasa a CERRADA.
- El **cupo** de una clase nunca puede quedar negativo; una reserva CANCELADA libera cupo.
- Toda validación sensible (membresía, cupo, token del QR, geoloc) se ejecuta **en el servidor**; el cliente no es confiable.
- La membresía pasa a **VENCIDA** automáticamente cuando la fecha de fin es anterior a hoy.

## 7. Requisitos no funcionales

### Accesibilidad (WCAG AA)
- Operable **por teclado** con foco visible.
- Todos los campos de formulario con **label** asociado.
- **Alt text** en imágenes informativas (ej. ejercicios).
- Contraste mínimo **4.5:1**.
- Errores comunicados **con texto**, no solo con color.
- El registro de visita ofrece un **fallback manual** (código en recepción) para quien no pueda usar la cámara.

### Usabilidad (MEELS, medible)
- **Eficiencia:** registrar ingreso por QR en ≤ 3 segundos desde que se abre la cámara.
- **Errores:** los mensajes indican qué pasó y cómo resolverlo (ej. "membresía vencida: regularizá tu cuota").
- **Aprendibilidad:** un socio nuevo registra su primera visita sin instrucciones externas.
- **Memorabilidad:** un socio que vuelve a la semana repite el flujo sin reaprenderlo.
- **Satisfacción:** el socio puede consultar su historial de visitas y cuota en su panel.

## 8. Fuera de alcance (por ahora)

- App nativa (iOS/Android); se entrega como **PWA**.
- QR rotativo con token firmado por hardware de recepción (el MVP usa QR fijo + socio logueado).
- Facturación electrónica / integración contable.
- Torniquete o control físico de acceso (molinete).
- Multi-sede: el MVP asume **un** gimnasio.
