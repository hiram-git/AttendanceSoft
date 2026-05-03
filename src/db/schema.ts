import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  time,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core'

// ────── Better-Auth tables ──────

export const userRoleEnum = pgEnum('user_role', ['staff', 'client'])

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name').notNull(),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('staff'),
  // When role='client' this links the auth user to a row in `clients`.
  // Forward reference to `clients` (defined below).
  clientId: uuid('client_id').references(() => clients.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ────── Domain tables ──────

export const appointmentKindEnum = pgEnum('appointment_kind', [
  'consulta',
  'seguimiento',
  'procedimiento',
  'bloqueo',
])

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'confirmada',
  'pendiente',
  'cancelada',
])

export const staff = pgTable('staff', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  role: text().notNull(),
  initials: text().notNull(),
  avatarGradient: text('avatar_gradient').notNull(),
  rooms: text().array().notNull().default([]),
})

/**
 * Weekly availability per staff member. weekday is 0 (Mon) .. 6 (Sun).
 * One row per (staffId, weekday). When no row exists for a day, that day
 * is considered "off".
 */
export const staffAvailability = pgTable('staff_availability', {
  id: uuid().primaryKey().defaultRandom(),
  staffId: uuid('staff_id')
    .notNull()
    .references(() => staff.id, { onDelete: 'cascade' }),
  weekday: integer().notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
})

export const services = pgTable('services', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  kind: appointmentKindEnum().notNull().default('consulta'),
})

export const clients = pgTable('clients', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text(),
  phone: text(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * Pending invitations for a client to claim a portal account.
 * Operator generates one per client; the link `/portal/invite/:token`
 * lets the client set a password and auto-creates their `user` row.
 */
export const clientInvitations = pgTable('client_invitations', {
  id: uuid().primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  token: text().notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const appointments = pgTable('appointments', {
  id: uuid().primaryKey().defaultRandom(),
  date: date().notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  label: text().notNull(),
  kind: appointmentKindEnum().notNull().default('consulta'),
  status: appointmentStatusEnum().notNull().default('confirmada'),
  staffId: uuid('staff_id').references(() => staff.id),
  clientId: uuid('client_id').references(() => clients.id),
  serviceId: uuid('service_id').references(() => services.id),
  room: text(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * Per-user device push tokens. One row per (userId, platform, token);
 * upsert from the mobile client on boot. Used by the server to fan out
 * notifications via FCM/APNs (sending side wired in a follow-up).
 */
export const devicePlatformEnum = pgEnum('device_platform', ['ios', 'android', 'web'])

export const deviceTokens = pgTable('device_tokens', {
  id: uuid().primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  platform: devicePlatformEnum().notNull(),
  token: text().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
})

export type Staff = typeof staff.$inferSelect
export type StaffAvailability = typeof staffAvailability.$inferSelect
export type Service = typeof services.$inferSelect
export type Client = typeof clients.$inferSelect
export type ClientInvitation = typeof clientInvitations.$inferSelect
export type Appointment = typeof appointments.$inferSelect
export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type DeviceToken = typeof deviceTokens.$inferSelect
export type UserRole = (typeof userRoleEnum.enumValues)[number]
export type DevicePlatform = (typeof devicePlatformEnum.enumValues)[number]
