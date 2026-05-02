import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '../db/index.ts'
import { staff, services, clients, appointments } from '../db/schema.ts'
import { auth } from './auth.ts'

// Forward all /api/auth/* requests to Better-Auth's fetch handler.
// Uses explicit GET/POST instead of .mount() to avoid the known
// 404 issue (better-auth #3384 / elysia #1806).
const authRoutes = new Elysia()
  .all('/api/auth/*', ({ request }) => auth.handler(request))

const KIND = t.Union([
  t.Literal('consulta'),
  t.Literal('seguimiento'),
  t.Literal('procedimiento'),
  t.Literal('bloqueo'),
])

const STATUS = t.Union([
  t.Literal('confirmada'),
  t.Literal('pendiente'),
  t.Literal('cancelada'),
])

export const api = new Elysia()
  .use(
    cors({
      origin: ['http://localhost:3000'],
      credentials: true,
    }),
  )
  .use(authRoutes)
  .resolve(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    return { session }
  })
  .get('/api/health', () => ({ ok: true }))
  .get('/api/me', ({ session }) => session ?? null)

  .guard(
    {
      beforeHandle: ({ session, set }) => {
        if (!session) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
      },
    },
    (app) =>
      app
        // ───── Staff ─────
        .get('/api/staff', () => db.select().from(staff))
        .post(
          '/api/staff',
          async ({ body }) => {
            const [row] = await db.insert(staff).values(body).returning()
            return row
          },
          {
            body: t.Object({
              name: t.String(),
              role: t.String(),
              initials: t.String(),
              avatarGradient: t.String(),
              rooms: t.Array(t.String()),
            }),
          },
        )
        .patch(
          '/api/staff/:id',
          async ({ params, body }) => {
            const [row] = await db
              .update(staff)
              .set(body)
              .where(eq(staff.id, params.id))
              .returning()
            return row
          },
          {
            body: t.Partial(
              t.Object({
                name: t.String(),
                role: t.String(),
                initials: t.String(),
                avatarGradient: t.String(),
                rooms: t.Array(t.String()),
              }),
            ),
          },
        )
        .delete('/api/staff/:id', async ({ params }) => {
          await db.delete(staff).where(eq(staff.id, params.id))
          return { ok: true }
        })

        // ───── Services ─────
        .get('/api/services', () => db.select().from(services))
        .post(
          '/api/services',
          async ({ body }) => {
            const [row] = await db.insert(services).values(body).returning()
            return row
          },
          {
            body: t.Object({
              name: t.String(),
              durationMinutes: t.Number(),
              kind: KIND,
            }),
          },
        )
        .patch(
          '/api/services/:id',
          async ({ params, body }) => {
            const [row] = await db
              .update(services)
              .set(body)
              .where(eq(services.id, params.id))
              .returning()
            return row
          },
          {
            body: t.Partial(
              t.Object({
                name: t.String(),
                durationMinutes: t.Number(),
                kind: KIND,
              }),
            ),
          },
        )
        .delete('/api/services/:id', async ({ params }) => {
          await db.delete(services).where(eq(services.id, params.id))
          return { ok: true }
        })

        // ───── Clients ─────
        .get('/api/clients', () => db.select().from(clients))
        .post(
          '/api/clients',
          async ({ body }) => {
            const [row] = await db.insert(clients).values(body).returning()
            return row
          },
          {
            body: t.Object({
              name: t.String(),
              email: t.Optional(t.Nullable(t.String())),
              phone: t.Optional(t.Nullable(t.String())),
            }),
          },
        )
        .patch(
          '/api/clients/:id',
          async ({ params, body }) => {
            const [row] = await db
              .update(clients)
              .set(body)
              .where(eq(clients.id, params.id))
              .returning()
            return row
          },
          {
            body: t.Partial(
              t.Object({
                name: t.String(),
                email: t.Optional(t.Nullable(t.String())),
                phone: t.Optional(t.Nullable(t.String())),
              }),
            ),
          },
        )
        .delete('/api/clients/:id', async ({ params }) => {
          await db.delete(clients).where(eq(clients.id, params.id))
          return { ok: true }
        })

        // ───── Appointments ─────
        .get(
          '/api/appointments',
          ({ query }) => {
            if (query.from && query.to) {
              return db
                .select()
                .from(appointments)
                .where(
                  and(
                    gte(appointments.date, query.from),
                    lte(appointments.date, query.to),
                  ),
                )
            }
            if (query.date) {
              return db
                .select()
                .from(appointments)
                .where(eq(appointments.date, query.date))
            }
            return db.select().from(appointments)
          },
          {
            query: t.Object({
              date: t.Optional(t.String()),
              from: t.Optional(t.String()),
              to: t.Optional(t.String()),
            }),
          },
        )
        .post(
          '/api/appointments',
          async ({ body }) => {
            const [row] = await db.insert(appointments).values(body).returning()
            return row
          },
          {
            body: t.Object({
              date: t.String(),
              startTime: t.String(),
              endTime: t.String(),
              label: t.String(),
              kind: t.Optional(KIND),
              status: t.Optional(STATUS),
              staffId: t.Optional(t.String()),
              clientId: t.Optional(t.String()),
              serviceId: t.Optional(t.String()),
              room: t.Optional(t.String()),
            }),
          },
        )
        .patch(
          '/api/appointments/:id',
          async ({ params, body }) => {
            const [row] = await db
              .update(appointments)
              .set(body)
              .where(eq(appointments.id, params.id))
              .returning()
            return row
          },
          {
            body: t.Partial(
              t.Object({
                date: t.String(),
                startTime: t.String(),
                endTime: t.String(),
                label: t.String(),
                kind: KIND,
                status: STATUS,
                staffId: t.Nullable(t.String()),
                clientId: t.Nullable(t.String()),
                serviceId: t.Nullable(t.String()),
                room: t.Nullable(t.String()),
              }),
            ),
          },
        )
        .delete('/api/appointments/:id', async ({ params }) => {
          await db.delete(appointments).where(eq(appointments.id, params.id))
          return { ok: true }
        }),
  )

export type Api = typeof api
