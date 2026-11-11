![Pulso](public/brand/pulso-horizontal-color.svg)

# Pulso

Sistema de administración de un gimnasio (socios, rutinas, dietas y turnos).
TP integrador de Metodologías y Desarrollos Web — UAI Rosario.

## Equipo
- Juanchi Fortuna (junnchy) — repository owner
- Emiliano Rios
- Mariano Nozzi
- Federico Riquelme

## Producción
https://gimnasio-mdw.vercel.app

## Qué hace
Gestiona un gimnasio con 3 roles (Admin, Profesor, Socio). El profesor arma rutinas
y dietas y dicta clases; el socio reserva turnos de clase y consulta su plan; el admin
gestiona planes, cuotas y pagos. Workflow principal: un socio con membresía activa
reserva una clase, el sistema valida cupo y cuota, confirma y registra la asistencia.

## Stack
Next.js (App Router) · TypeScript · PostgreSQL (Supabase) · Prisma · Zod · Auth.js · Tailwind + shadcn/ui · Vercel

## Cómo correrlo
```bash
npm install
cp .env.example .env.local   # completar DATABASE_URL, DIRECT_URL, AUTH_SECRET
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Pruebas

Dos capas, con dos comandos:

- `npm test`: las reglas de dominio y los handlers, con vitest. Sin base ni red.
- `npm run test:e2e`: el flujo principal de la spec (§5, el QR de la puerta) y la matriz de
  permisos de `docs/api.md`, con Playwright. Migra y carga el seed en la base de `.env.e2e`,
  compila la app en `.next-e2e` y la levanta en el puerto 3100, así que no choca con `npm run dev`.

Las e2e **nunca corren contra la base de producción**: `playwright.config.ts` se niega a arrancar
si `DATABASE_URL` y `DIRECT_URL` no apuntan a localhost y a la base `pulso_e2e`. La primera vez:

```bash
docker run -d --name pulso-e2e -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pulso_e2e -p 54329:5432 postgres:16-alpine
npx playwright install chromium
```

Después, cada vez:

```bash
docker start pulso-e2e            # si la base no está corriendo
npm run test:e2e                  # las corre todas en la terminal
npm run test:e2e -- --ui          # interfaz visual: paso a paso, con la pantalla de cada uno
npm run test:e2e -- --headed      # muestra el navegador mientras corre
npx playwright show-trace test-results/<prueba>/trace.zip   # el recorrido de una que falló
```

Sin Docker sirve cualquier PostgreSQL local en el puerto 54329, con la base `pulso_e2e` y el
usuario `postgres`/`postgres`. En cada Pull Request el CI corre las dos capas (`verificar` y `e2e`).