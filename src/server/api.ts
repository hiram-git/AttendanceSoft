import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '../db/index.ts'
import {
  staff,
  staffAvailability,
  services,
  clients,
  clientInvitations,
  appointments,
  user,
} from '../db/schema.ts'
import { randomBytes } from 'node:crypto'
import { auth } from './auth.ts'
import { describeConflicts, findConflicts } from './conflicts.ts'

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

const webOrigin = process.env.WEB_URL ?? 'http://localhost:3000'

const INVITATION_TTL_DAYS = 7

function generateInvitationToken() {
  return randomBytes(24).toString('base64url')
}

export const api = new Elysia()
  .use(
    cors({
      origin: [webOrigin],
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

  // ───── Public portal endpoints (no auth) ─────

  // Read-only lookup of an invitation by token. Used by the portal
  // invite landing page to prefill the client's name + email and
  // show "expired" / "already used" states.
  .get(
    '/api/portal/invitations/:token',
    async ({ params, set }) => {
      const rows = await db
        .select({ inv: clientInvitations, client: clients })
        .from(clientInvitations)
        .innerJoin(clients, eq(clientInvitations.clientId, clients.id))
        .where(eq(clientInvitations.token, params.token))
      if (rows.length === 0) {
        set.status = 404
        return { error: 'not_found' }
      }
      const { inv, client } = rows[0]
      const now = new Date()
      let state: 'pending' | 'expired' | 'used' = 'pending'
      if (inv.usedAt) state = 'used'
      else if (inv.expiresAt < now) state = 'expired'
      return {
        state,
        client: { id: client.id, name: client.name, email: client.email },
        expiresAt: inv.expiresAt.toISOString(),
      }
    },
  )

  .post(
    '/api/portal/accept-invite',
    async ({ body, set }) => {
      const rows = await db
        .select({ inv: clientInvitations, client: clients })
        .from(clientInvitations)
        .innerJoin(clients, eq(clientInvitations.clientId, clients.id))
        .where(eq(clientInvitations.token, body.token))
      if (rows.length === 0) {
        set.status = 404
        return { error: 'not_found', message: 'Invitación no encontrada.' }
      }
      const { inv, client } = rows[0]
      if (inv.usedAt) {
        set.status = 410
        return { error: 'already_used', message: 'Esta invitación ya fue usada.' }
      }
      if (inv.expiresAt < new Date()) {
        set.status = 410
        return { error: 'expired', message: 'Esta invitación expiró.' }
      }

      const email = client.email
      if (!email) {
        set.status = 400
        return { error: 'no_email', message: 'El cliente no tiene email registrado.' }
      }

      // Refuse if the client already has a portal user (someone accepted
      // a previous invitation for the same client_id).
      const existing = await db.select().from(user).where(eq(user.clientId, client.id))
      if (existing.length > 0) {
        set.status = 409
        return { error: 'already_linked', message: 'Este cliente ya tiene cuenta.' }
      }

      const res = await auth.api.signUpEmail({
        body: {
          email,
          password: body.password,
          name: client.name,
          role: 'client',
          clientId: client.id,
        },
        asResponse: true,
      })

      if (res.ok) {
        await db
          .update(clientInvitations)
          .set({ usedAt: new Date() })
          .where(eq(clientInvitations.id, inv.id))
      }
      return res
    },
    {
      body: t.Object({
        token: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    },
  )

  .post(
    '/api/portal/signup',
    async ({ body, set }) => {
      // Reject duplicate emails up front so we don't create an orphan
      // `clients` row when Better-Auth rejects the signup.
      const existing = await db
        .select()
        .from(user)
        .where(eq(user.email, body.email))
      if (existing.length > 0) {
        set.status = 409
        return {
          error: 'email_taken',
          message: 'Ya existe una cuenta con ese correo.',
        }
      }

      // Create the clients row first so we have an id to link.
      const [clientRow] = await db
        .insert(clients)
        .values({
          name: body.name,
          email: body.email,
          phone: body.phone ?? null,
        })
        .returning()

      try {
        const res = await auth.api.signUpEmail({
          body: {
            email: body.email,
            password: body.password,
            name: body.name,
            role: 'client',
            clientId: clientRow.id,
          },
          asResponse: true,
        })
        if (!res.ok) {
          // Roll back orphan clients row if Better-Auth rejected.
          await db.delete(clients).where(eq(clients.id, clientRow.id))
        }
        return res
      } catch (e) {
        await db.delete(clients).where(eq(clients.id, clientRow.id))
        set.status = 500
        return {
          error: 'signup_failed',
          message: e instanceof Error ? e.message : 'unknown',
        }
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        phone: t.Optional(t.String()),
      }),
    },
  )

  // ───── Authenticated portal endpoints (role='client') ─────
  .guard(
    {
      beforeHandle: ({ session, set }) => {
        if (!session) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        if (session.user.role !== 'client') {
          set.status = 403
          return { error: 'Forbidden', message: 'Esta sección es solo para clientes.' }
        }
      },
    },
    (app) =>
      app
        .get('/api/portal/me', async ({ session }) => {
          const clientId = session?.user.clientId ?? null
          const client = clientId
            ? (await db.select().from(clients).where(eq(clients.id, clientId)))[0] ?? null
            : null
          return { user: session?.user, client }
        })
        .get(
          '/api/portal/appointments',
          async ({ session, set }) => {
            const clientId = session?.user.clientId
            if (!clientId) {
              set.status = 400
              return { error: 'no_client', message: 'Tu cuenta no está vinculada a un cliente.' }
            }
            return db
              .select()
              .from(appointments)
              .where(eq(appointments.clientId, clientId))
          },
        ),
  )

  // ───── Staff backoffice endpoints (role='staff') ─────
  .guard(
    {
      beforeHandle: ({ session, set }) => {
        if (!session) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        if (session.user.role !== 'staff') {
          set.status = 403
          return { error: 'Forbidden', message: 'Esta sección es solo para personal.' }
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

        // ───── Staff availability ─────
        .get('/api/staff/:id/availability', ({ params }) =>
          db
            .select()
            .from(staffAvailability)
            .where(eq(staffAvailability.staffId, params.id)),
        )
        .put(
          '/api/staff/:id/availability',
          async ({ params, body }) => {
            await db
              .delete(staffAvailability)
              .where(eq(staffAvailability.staffId, params.id))
            if (body.length > 0) {
              await db
                .insert(staffAvailability)
                .values(body.map((b) => ({ ...b, staffId: params.id })))
            }
            return db
              .select()
              .from(staffAvailability)
              .where(eq(staffAvailability.staffId, params.id))
          },
          {
            body: t.Array(
              t.Object({
                weekday: t.Integer({ minimum: 0, maximum: 6 }),
                startTime: t.String(),
                endTime: t.String(),
              }),
            ),
          },
        )

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

        // Create a portal invitation for a client. Returns the URL the
        // operator should send (until a real mailer is wired up, the
        // operator copies this from the UI and shares it manually).
        .post('/api/clients/:id/invitations', async ({ params, set }) => {
          const found = await db.select().from(clients).where(eq(clients.id, params.id))
          if (found.length === 0) {
            set.status = 404
            return { error: 'not_found' }
          }
          const client = found[0]
          if (!client.email) {
            set.status = 400
            return {
              error: 'no_email',
              message: 'El cliente no tiene email registrado. Edítalo antes de invitar.',
            }
          }
          // If the client already has a portal user, generating new
          // invitations is meaningless.
          const existingUser = await db
            .select()
            .from(user)
            .where(eq(user.clientId, client.id))
          if (existingUser.length > 0) {
            set.status = 409
            return { error: 'already_linked', message: 'Este cliente ya tiene cuenta.' }
          }

          const token = generateInvitationToken()
          const expiresAt = new Date(
            Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
          )
          const [inv] = await db
            .insert(clientInvitations)
            .values({ clientId: client.id, token, expiresAt })
            .returning()

          return {
            id: inv.id,
            token,
            expiresAt: inv.expiresAt.toISOString(),
            url: `${webOrigin}/portal/invite/${token}`,
          }
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
          async ({ body, set }) => {
            const conflicts = await findConflicts({
              date: body.date,
              startTime: body.startTime,
              endTime: body.endTime,
              staffId: body.staffId,
              room: body.room,
            })
            if (conflicts.length > 0) {
              set.status = 409
              return {
                error: 'conflict',
                message: describeConflicts(conflicts),
                conflicts,
              }
            }
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
          async ({ params, body, set }) => {
            const rows = await db
              .select()
              .from(appointments)
              .where(eq(appointments.id, params.id))
            if (rows.length === 0) {
              set.status = 404
              return { error: 'not_found' }
            }
            const existing = rows[0]
            const merged = {
              date: body.date ?? existing.date,
              startTime: body.startTime ?? existing.startTime,
              endTime: body.endTime ?? existing.endTime,
              staffId: body.staffId === undefined ? existing.staffId : body.staffId,
              room: body.room === undefined ? existing.room : body.room,
              status: body.status ?? existing.status,
            }
            // Skip conflict check if the row is being marked cancelled.
            if (merged.status !== 'cancelada') {
              const conflicts = await findConflicts({
                date: merged.date,
                startTime: merged.startTime,
                endTime: merged.endTime,
                staffId: merged.staffId,
                room: merged.room,
                ignoreId: params.id,
              })
              if (conflicts.length > 0) {
                set.status = 409
                return {
                  error: 'conflict',
                  message: describeConflicts(conflicts),
                  conflicts,
                }
              }
            }
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
