# AttendanceSoft

Sistema de agendamiento de citas. Implementación del diseño handoff usando el stack:

- **Runtime / package manager:** Bun
- **Framework full-stack:** TanStack Start (file-based routing + SSR)
- **Data fetching:** TanStack Query
- **Forms:** TanStack Form + Zod
- **API:** Elysia
- **Auth:** Better-Auth (email + password) con sesiones por cookie
- **ORM:** Drizzle
- **DB:** Postgres (vía docker-compose)
- **Estilos:** CSS con design tokens (variables)

## Estructura

```
src/
  routes/                  # rutas file-based de TanStack Router
    __root.tsx
    index.tsx              # Landing
    login.tsx
    dashboard.tsx
    backoffice.tsx
  components/              # Sidebar, Topbar, AppShell, icons
  lib/                     # ThemeProvider, useTheme, api client
  db/
    schema.ts              # Drizzle schema (staff, services, clients, appointments)
    seed.ts                # datos iniciales
    index.ts               # cliente Drizzle
  server/
    api.ts                 # rutas Elysia (/api/*)
    index.ts               # entry point del API server
  styles/                  # tokens.css + CSS por pantalla (landing, login, shell, etc.)
  styles.css               # entry de estilos (importa Tailwind + módulos del design system)
docker-compose.yml         # Postgres local
drizzle.config.ts
```

## Setup local

1. Copiar el archivo de variables y ajustarlo si hace falta

   ```bash
   cp .env.example .env.local
   ```

2. Instalar dependencias

   ```bash
   bun install
   ```

3. Levantar Postgres

   ```bash
   bun run db:up
   ```

4. Crear schema y poblar con datos demo

   ```bash
   bun run db:push
   bun run db:seed
   ```

5. Levantar web + API en paralelo

   ```bash
   bun run dev
   ```

   - Web (TanStack Start): <http://localhost:3000>
   - API (Elysia): <http://localhost:3001>

## Scripts

| Script | Descripción |
|---|---|
| `bun run dev` | Levanta web + API concurrentemente |
| `bun run dev:web` | Solo el frontend (TanStack Start) |
| `bun run dev:api` | Solo el API (Elysia con `--watch`) |
| `bun run build` | Build de producción del frontend |
| `bun run start:api` | Corre el API en modo prod |
| `bun run db:up` / `db:down` | Postgres en Docker |
| `bun run db:push` | Sincroniza el schema Drizzle con la DB |
| `bun run db:generate` / `db:migrate` | Genera/aplica migraciones |
| `bun run db:seed` | Inserta datos demo |
| `bun run db:studio` | Drizzle Studio |
| `bun run lint` | ESLint |

## Endpoints API

Públicos:

- `GET /api/health`
- `GET /api/auth/*` — manejado por Better-Auth (sign-in, sign-up, sign-out, get-session, etc.)
- `GET /api/me` — devuelve la sesión actual o `null`

Protegidos (requieren cookie de sesión). Cada recurso tiene CRUD completo:

- `GET|POST /api/staff` y `PATCH|DELETE /api/staff/:id`
- `GET|PUT /api/staff/:id/availability` — disponibilidad semanal
  (PUT reemplaza la semana completa atómicamente)
- `GET|POST /api/services` y `PATCH|DELETE /api/services/:id`
- `GET|POST /api/clients` y `PATCH|DELETE /api/clients/:id`
- `GET /api/appointments` (`?date=` un día, `?from=&to=` rango)
- `POST /api/appointments` — devuelve **409** si la cita choca con
  otra del mismo personal o sala (mensaje + lista de conflictos)
- `PATCH /api/appointments/:id` — misma validación; se omite cuando se
  marca `status='cancelada'`
- `DELETE /api/appointments/:id`

## Usuario demo

El seed (`bun run db:seed`) crea un usuario para iniciar sesión:

- **Correo:** `camila@vertice.mx`
- **Contraseña:** `attendancesoft`

## Recuperación de contraseña

1. Desde el login, click en "¿La olvidaste?" → `/forgot-password`.
2. Ingresa el correo. El servidor (Better-Auth) genera un token y, en lugar de
   enviar correo real, **imprime el enlace de recuperación en la consola del API
   server** — buscar la sección `────── PASSWORD RESET ──────`.
3. Copiar el link y pegarlo en el navegador (apunta a `/reset-password?token=...`).
4. Definir la nueva contraseña → redirige al login.

Para producción, reemplaza el callback `sendResetPassword` en `src/server/auth.ts`
por uno que envíe el correo real (Resend, Postmark, etc.).

## Pantallas

Públicas:

- `/` — Landing
- `/login`, `/forgot-password`, `/reset-password`

Protegidas (requieren sesión):

- `/dashboard` — calendario mensual + métricas derivadas + agenda del día.
- `/backoffice` — scheduler semanal de equipo y disponibilidad.
- `/backoffice/appointments` — agenda completa con filtros (rango, tipo, estado), edit y delete.
- `/backoffice/clients` — clientes (CRUD).
- `/backoffice/services` — servicios (CRUD, filtro por tipo).
- `/backoffice/staff` — personal (CRUD, picker de avatar gradient, salas separadas por coma, editor de **disponibilidad semanal** por persona).
- `/backoffice/reports` — resumen del mes: totales, breakdown por tipo y carga por persona.
- `/backoffice/settings` — placeholder.
- `/profile` — datos de la cuenta (nombre) y cambio de contraseña.

## Variables de entorno

Toda la config se centraliza en `.env.example` (committeado). Para correr
localmente, copialo a `.env.local` (gitignored).

| Variable | Quién la usa | Notas |
|---|---|---|
| `DATABASE_URL` | API + Drizzle CLI | Conexión a Postgres. Requerida. |
| `AUTH_SECRET` | API (Better-Auth) | Genera con `openssl rand -base64 32`. Requerida en prod. |
| `NODE_ENV` | API | `production` activa cookies `Secure`. |
| `PORT` | API | Puerto donde escucha Elysia (default `3001`). Vercel/Railway/Fly lo inyectan automáticamente. |
| `HOST` | API | Hostname al que bindea Elysia. En contenedores/serverless usa `0.0.0.0`. |
| `WEB_URL` | API | URL pública del frontend. Se usa para CORS y para construir el link de recuperación de contraseña. |
| `PUBLIC_API_URL` | Web (cliente) | URL pública del API. Se inyecta en el bundle (prefijo `PUBLIC_*` o `VITE_*` configurado en `vite.config.ts`). |

## Deploy

El proyecto está partido en dos servicios para que cada uno pueda ir a una
plataforma distinta:

- **API (Elysia)** — corre con `bun run start:api`. Necesita `PORT`, `HOST`,
  `DATABASE_URL`, `AUTH_SECRET`, `WEB_URL`, `NODE_ENV=production`.
  Buena opción: Railway o Fly (Bun runtime + Postgres).
- **Web (TanStack Start)** — `bun run build` produce `dist/`. Requiere
  `PUBLIC_API_URL` apuntando al API público. Buena opción: Vercel o
  Cloudflare Pages.

Setea las variables desde el panel de la plataforma (no las commits).
Después del primer deploy, corre `bun run db:push` y `bun run db:seed`
contra la `DATABASE_URL` de prod (una sola vez).
