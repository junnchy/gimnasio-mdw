# ADR 0004 — Identidad delegada en Google y sesión en token

**Estado:** propuesto (se acepta con la review del PR de la clase 6)
**Fecha:** 2026-09-29
**Decide:** equipo

---

## Contexto

Hasta la clase 5 la API no sabía quién la llamaba. Cada handler tenía un
`TODO (clase 6)` y usaba `usuarioDeEjemplo()`, que devolvía siempre el mismo
socio, profesor o admin del seed. Con eso cualquiera podía, desde Postman,
cancelar reservas ajenas, registrar pagos o crear planes.

La spec tiene tres roles (SOCIO, PROFESOR, ADMIN) con permisos distintos, y el
riesgo más serio es que alguien se **auto-asigne** un rol: un socio que pudiera
declararse ADMIN podría registrarse pagos en efectivo a sí mismo y activar su
membresía sin pagar.

Hay dos decisiones, independientes entre sí.

## Decisión 1 — La identidad la prueba Google (Auth.js + OAuth)

| Opción | A favor | En contra |
|---|---|---|
| **Google con Auth.js** | No guardamos contraseñas, así que no las podemos filtrar. No hay que construir registro, recuperación ni verificación de mail | Dependemos de un servicio que no controlamos: si Google no responde, nadie entra. El socio necesita cuenta de Google |
| Usuario y contraseña propios | Sin dependencia externa | Hash (bcrypt/argon2), recuperación, verificación de mail, mail duplicado: cuatro pantallas y varias reglas de seguridad que no están en la spec |
| Supabase Auth / Clerk | Resuelven lo mismo con más funciones | Otro proveedor más, y se pierde el soporte de los talleres (la cátedra usa Auth.js) |

**Elegimos Google con Auth.js.** La alternativa no es "no depender de nadie",
es hacerse cargo de guardar contraseñas. La mayoría de los socios ya tiene
cuenta de Google en el celular, que es donde se escanea el QR.

### El rol no viene de Google

Google prueba que alguien es dueño de un mail. No sabe si esa persona es
profesora del gimnasio. Por eso:

    Google       →  prueba quién sos
    nuestra base →  dice QUÉ sos adentro del sistema (User.rol)

El callback `jwt` de `lib/auth.ts` hace un `upsert` que **crea siempre SOCIO**
(el menor privilegio) y tiene el `update` **vacío a propósito**: si la persona
ya existe, volver a entrar no pisa el rol que tiene en la base.

PROFESOR y ADMIN se asignan **a mano en la base** (Prisma Studio, o las
variables `SEED_ADMIN_EMAIL` / `SEED_PROFESOR_EMAIL` del seed). La API no
ofrece ninguna forma de cambiar un rol. La pantalla para que el admin lo haga
no está en la spec; lo que exige la regla es que nadie pueda auto-asignárselo.

### Solo entra un mail que Google verificó y controla (review del PR #6)

Como la cuenta se vincula con nuestra base **solo por el mail**, aceptar un
mail no verificado permitiría presentarse con el mail de un ADMIN y heredar su
rol. El callback `signIn` (`esIdentidadGoogleConfiable` en `lib/auth.ts`) corre
antes del upsert y exige:

- proveedor Google;
- `email_verified === true` en el perfil original de Google;
- que Google sea **autoritativo** para ese mail: una cuenta `@gmail.com` o de
  Google Workspace (el perfil trae `hd`).

**Qué se resigna:** no pueden entrar las cuentas de Google creadas con un mail
de otro proveedor (Outlook, Yahoo). Google advierte que, para esos mails,
haberlo verificado alguna vez no prueba que la persona lo siga controlando.
Admitirlas exigiría vincular por el identificador estable de Google (`sub`) en
lugar del mail, que hoy no guardamos. Si aparece esa necesidad, se revisa esta
decisión.

## Decisión 2 — La sesión viaja en un token (JWT), no en una tabla

| Opción | A favor | En contra |
|---|---|---|
| **Token (JWT cifrado en cookie)** | Cero consultas a la base para saber quién llama; en Vercel (serverless) es la diferencia entre abrir una conexión o ninguna. No hacen falta tablas `Account`/`Session` ni migración | **El rol del token es una foto**: si un admin pasa a alguien de SOCIO a PROFESOR, el cambio se ve recién cuando esa persona vuelve a iniciar sesión. No se puede revocar una sesión puntual |
| Sesión en base (Prisma Adapter) | Un cambio de rol o una baja se aplican al instante; se puede cerrar la sesión de alguien | Una consulta a la base en **cada** request, y tres tablas más con su migración |

**Elegimos token.** Los cambios de rol en un gimnasio son raros (se contrata un
profesor), y "cerrá sesión y volvé a entrar" es una instrucción aceptable. La
cookie va cifrada (JWE), no solo firmada: sin `AUTH_SECRET` no se puede leer ni
fabricar.

Por el mismo motivo, **si se borra un usuario de la base, su sesión sigue viva
hasta que vence**: el token no se consulta contra la tabla. Sus requests pasan
`requerirUsuario` y fallan después, al tocar datos que ya no existen, con un
500 en lugar de un 401. Lo aceptamos: en el sistema no se borran usuarios con
historial (las relaciones son `Restrict`), así que en la práctica no pasa.

**Cuándo revisar esta decisión:** si hiciera falta dar de baja a alguien al
instante (un profesor que se va en malos términos), o si aparece la pantalla
de administración de roles. Ahí conviene pasar a sesión en base.

## Consecuencias

- `lib/auth.ts` es el único lugar que sabe de Auth.js. El resto del proyecto
  usa `requerirUsuario(rol?)` y `obtenerUsuario()`.
- `requerirUsuario` **lanza** (`NoAutenticado` → 401, `NoAutorizado` → 403) en
  lugar de devolver, a diferencia de las reglas de la clase 5: si devolviera,
  olvidarse el `if` dejaría el endpoint abierto sin que nada avise.
- Las consultas de datos propios llevan el id de la sesión en el WHERE. Lo
  ajeno responde 404, igual que lo inexistente.
- Hay que cargar `AUTH_SECRET`, `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` en
  Vercel, y registrar en Google la URI de callback de producción.
