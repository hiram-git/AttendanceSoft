import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.ts'
import { staff, services, clients, appointments } from '../db/schema.ts'
import { auth } from './auth.ts'

// Forward all /api/auth/* requests to Better-Auth's fetch handler.
// Uses explicit GET/POST instead of .mount() to avoid the known
// 404 issue (better-auth #3384 / elysia #1806).
const authRoutes = new Elysia()
  .all('/api/auth/*', ({ request }) => auth.handler(request))

export const api = new Elysia()
  .use(
    cors({
      origin: ['http://localhost:3000'],
      credentials: true,
    }),
  )
  .use(authRoutes)
  // Resolve the current session once per request from the cookie.
  .resolve(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    return { session }
  })
  .get('/api/health', () => ({ ok: true }))
  .get('/api/me', ({ session }) => session ?? null)

  // Domain endpoints — guarded by session
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
        .get('/api/staff', () => db.select().from(staff))
        .get('/api/services', () => db.select().from(services))
        .get('/api/clients', () => db.select().from(clients))
        .get(
          '/api/appointments',
          ({ query }) => {
            if (query.date) {
              return db
                .select()
                .from(appointments)
                .where(eq(appointments.date, query.date))
            }
            return db.select().from(appointments)
          },
          { query: t.Object({ date: t.Optional(t.String()) }) },
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
              kind: t.Optional(
                t.Union([
                  t.Literal('consulta'),
                  t.Literal('seguimiento'),
                  t.Literal('procedimiento'),
                  t.Literal('bloqueo'),
                ]),
              ),
              staffId: t.Optional(t.String()),
              clientId: t.Optional(t.String()),
              serviceId: t.Optional(t.String()),
              room: t.Optional(t.String()),
            }),
          },
        )
        .delete('/api/appointments/:id', async ({ params }) => {
          await db.delete(appointments).where(eq(appointments.id, params.id))
          return { ok: true }
        }),
  )

export type Api = typeof api
