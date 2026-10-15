# AGENTS.md — reglas de este proyecto

Este archivo lo lee tu asistente de IA (Cursor, Copilot, Claude Code, etc.) antes de escribir código. Manténlo actualizado: si el equipo cambia una convención y esto no lo refleja, la IA va a seguir escribiendo con la convención vieja.

> **Cómo se escribe una regla acá:** verificable, no aspiracional. "Escribir código limpio" no es una regla. "Un componente por archivo, en PascalCase" sí lo es.

## Qué es este proyecto

<Completar en la clase 1: qué hace el sistema, quiénes son los dos roles y cuál es el flujo principal.>

## Stack

- Next.js (App Router) + TypeScript
- Postgres + Prisma (o MongoDB Atlas + Prisma, si el equipo lo eligió y lo documentó en un ADR)
- Zod para validación
- Auth.js para sesión y roles
- Tailwind + shadcn/ui
- Deploy en Vercel

## Comandos

```bash
npm run dev          # desarrollo
npm run build        # build de producción
npm run typecheck    # chequeo de tipos
npm test         # tests
npx prisma migrate dev --name <nombre>
```

Después de tocar `prisma/schema.prisma`, siempre generar una migración. Nunca editar SQL de migraciones ya aplicadas.

## Estructura y dónde va cada cosa

| Si vas a escribir… | Va en… |
|---|---|
| Una página | `app/(public)/` si es sin sesión, `app/(app)/` si requiere sesión |
| Un endpoint | `app/api/<recurso>/route.ts` |
| Un componente reutilizable del dominio | `components/` |
| Un componente de UI base (botón, tarjeta, insignia) | `components/ui/`, traído con `npx shadcn@latest add` |
| El estado de error de una pantalla | `error.tsx` al lado de su `page.tsx` |
| Una consulta a la base | `lib/db/<entidad>.ts` |
| Un schema de validación | `lib/schemas/<entidad>.ts` |
| Un helper sin dependencias | `lib/utils.ts` |

## Reglas

### Datos
- **Todo acceso a la base pasa por `lib/db/`.** Está prohibido importar el cliente de Prisma en componentes o en `app/`.
- El cliente de Prisma se importa solo desde `lib/db/client.ts`.
- Toda consulta que devuelva listas tiene paginación o límite explícito.

### Validación
- **Toda entrada externa se valida con un schema de Zod** definido en `lib/schemas/`. Entrada externa = body de un request, params, query string, formulario, respuesta de una API de terceros.
- El mismo schema se usa en el cliente y en el servidor. No duplicar reglas de validación.
- Prohibido `any`. Si no se conoce el tipo, usar `unknown` y validar.

### Seguridad
- **La autorización se verifica siempre en el servidor**, en cada Route Handler y cada Server Action. Que la UI esconda un botón no es una medida de seguridad.
- Nunca confiar en un `userId` o un `role` que venga del cliente: se leen de la sesión.
- Los secretos van en variables de entorno. Ninguna variable con secretos lleva el prefijo `NEXT_PUBLIC_`.

### React / Next
- Los componentes son Server Components por defecto. `"use client"` solo si hay estado, efectos o eventos del navegador.
- Un componente por archivo: el componente en PascalCase y el archivo en kebab-case (`FiltroReservas` en `components/filtro-reservas.tsx`). Los archivos de utilidades, en camelCase.
- Las pantallas leen con `await` a `lib/db/`, nunca con `fetch` a la API propia, y la consulta lleva el id de la sesión.
- Una pantalla con sesión chequea la sesión (`requerirUsuarioEnPantalla`) **antes** de cualquier `<Suspense>`. No usar `loading.tsx` en un segmento que redirige o llama a `notFound()`: el status sale 200 y la redirección o el 404 llegan tarde, dentro del stream.
- Los estados de carga y de error se resuelven siempre; no dejar la pantalla en blanco.
- **Las pantallas y sus direcciones salen del mapa de pantallas de `docs/spec.md` (§5).** No se inventan rutas: si falta una fila, se pregunta y se agrega al mapa antes de crear la ruta.
- **La sesión se verifica en cada página, no en el layout.** Un layout no se vuelve a ejecutar en cada navegación del cliente y se renderiza en paralelo con la página: no autoriza nada. Toda página de `app/(app)/` llama a `requerirUsuarioEnPantalla("<su ruta>")`, que redirige a `/ingresar?callbackUrl=<su ruta>`, y cada consulta lleva el id de la sesión.
- **Una pantalla que lee datos resuelve sus cinco estados:** cargando (`<Suspense>` con esqueleto), con datos, vacío, sin resultados y error (`error.tsx`). Ninguno queda en blanco.
- **Vacío y sin resultados no dicen lo mismo.** "Todavía no tenés…" lo resuelve el servidor con `<SinDatos>`; "ninguno coincide…" lo resuelve el componente que tiene el filtro, porque es el único que sabe qué se eligió.
- La pantalla de error no muestra el mensaje de la excepción: el detalle va a `console.error`.
- Un 404 no menciona "permiso": "no existe" y "no es tuya" usan el mismo texto.

### Estilos
- Solo Tailwind. Nada de CSS suelto ni estilos inline salvo valores calculados en runtime.
- Los componentes de UI base salen de shadcn/ui y se editan en `components/ui/`.

### Marca (Pulso — `docs/marca/`)
- **Los colores, radios y fuentes solo se escriben en `app/globals.css`.** Fuera de ese archivo no hay valores hex, `rgb()` ni `oklch()`: se usan los tokens (`bg-primary`, `text-muted-foreground`, `bg-pulso-lima`).
- El logo se usa con `<Logo />` de `components/logo.tsx`; no se reescribe ni se cambia su tipografía o sus colores.
- **Todo texto cumple contraste 4,5:1.** Prohibido: `text-pulso-lima` sobre fondo claro y `text-pulso-acero` sobre fondo oscuro.
- Ningún estado se comunica solo con color: la insignia lleva color, ícono y palabra ("Vencida", "Sin cupo").
- Los textos de la interfaz van en voseo ("Reservá", "Escaneá") y todo mensaje de error dice qué hacer.

### Git
- Ramas: `feat/<descripcion-corta>`, `fix/<descripcion-corta>`.
- Commits en imperativo y en español: "agrega validación de turnos superpuestos".
- Nunca commitear `.env.local` ni credenciales.

## Cómo quiero que trabajes

- Si la consigna es ambigua, **preguntá antes de escribir código**. No inventes reglas de negocio.
- Cambios chicos y enfocados. No refactorices archivos que no tienen que ver con la tarea.
- Antes de crear un helper nuevo, buscá si ya existe uno en `lib/`.
- Cuando toques algo de seguridad o del modelo de datos, explicá el porqué del cambio: son las dos áreas que se revisan línea por línea.

## Fuente de verdad
- El **qué** del sistema vive en `docs/spec.md`. Regla: **si no está en la spec, no se implementa.**
- Los **contratos de datos** viven en `lib/schemas/` (Zod). Los tipos se derivan con `z.infer`, nunca se escriben a mano en paralelo.

## Reglas verificables (Clase 2)
- **Prohibido `any`** (lo verifica el linter). Ante datos desconocidos usar `unknown` y validar antes de usar.
- **Todo input externo** (formularios, body de HTTP, params, respuestas de API) se valida con un schema de **Zod** en el borde del sistema, antes de tocar la base.
- Los **estados** se modelan con **uniones literales** (`z.enum([...])`), nunca strings sueltos.
- Los strings llevan **límites explícitos** (`min`/`max`/`format`).
- Las fechas que vienen de formularios/JSON se parsean con `z.coerce.date()`.
- Usar `safeParse()` cuando se quiere manejar el error como resultado; `parse()` solo cuando un fallo debe cortar el flujo.
