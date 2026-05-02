import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.ts'
import { staff, services, clients, appointments } from '../db/schema.ts'

export const api = new Elysia({ prefix: '/api' })
  .use(cors())
  .get('/health', () => ({ ok: true }))

  // Staff
  .get('/staff', async () => db.select().from(staff))

  // Services
  .get('/services', async () => db.select().from(services))

  // Clients
  .get('/clients', async () => db.select().from(clients))

  // Appointments
  .get('/appointments', async ({ query }) => {
    if (query.date) {
      return db.select().from(appointments).where(eq(appointments.date, query.date))
    }
    return db.select().from(appointments)
  }, {
    query: t.Object({ date: t.Optional(t.String()) }),
  })

  .post('/appointments', async ({ body }) => {
    const [row] = await db.insert(appointments).values(body).returning()
    return row
  }, {
    body: t.Object({
      date: t.String(),
      startTime: t.String(),
      endTime: t.String(),
      label: t.String(),
      kind: t.Optional(t.Union([
        t.Literal('consulta'),
        t.Literal('seguimiento'),
        t.Literal('procedimiento'),
        t.Literal('bloqueo'),
      ])),
      staffId: t.Optional(t.String()),
      clientId: t.Optional(t.String()),
      serviceId: t.Optional(t.String()),
      room: t.Optional(t.String()),
    }),
  })

  .delete('/appointments/:id', async ({ params }) => {
    await db.delete(appointments).where(eq(appointments.id, params.id))
    return { ok: true }
  })

export type Api = typeof api
