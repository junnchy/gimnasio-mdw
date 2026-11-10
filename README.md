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
```bash
npm test             # dominio e integración (vitest)
npm run test:e2e     # la app compilada contra una base local (Playwright)
```
`npm run test:e2e` necesita un Postgres local, nunca el de producción
(`playwright.config.ts` se niega a arrancar si `DATABASE_URL` no es local). Se levanta
una vez con Docker y usa las variables de `.env.e2e`:
```bash
docker run -d --name pulso-e2e -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pulso_e2e -p 54330:5432 postgres:16-alpine
npx playwright install chromium
npm run test:e2e -- concurrencia
```