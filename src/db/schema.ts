import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  time,
  pgEnum,
} from 'drizzle-orm/pg-core'

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

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const staff = pgTable('staff', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  role: text().notNull(),
  initials: text().notNull(),
  avatarGradient: text('avatar_gradient').notNull(),
  rooms: text().array().notNull().default([]),
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

export type Staff = typeof staff.$inferSelect
export type Service = typeof services.$inferSelect
export type Client = typeof clients.$inferSelect
export type Appointment = typeof appointments.$inferSelect
export type User = typeof users.$inferSelect
