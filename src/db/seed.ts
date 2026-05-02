import 'dotenv/config'
import { db } from './index.ts'
import {
  staff,
  services,
  clients,
  appointments,
  user as userTable,
  session as sessionTable,
  account as accountTable,
  verification as verificationTable,
} from './schema.ts'
import { auth } from '../server/auth.ts'

const DEMO_EMAIL = 'camila@vertice.mx'
const DEMO_PASSWORD = 'attendancesoft'
const DEMO_NAME = 'Camila Reyes'

async function seed() {
  console.log('Seeding database…')

  await db.delete(appointments)
  await db.delete(clients)
  await db.delete(services)
  await db.delete(staff)
  await db.delete(sessionTable)
  await db.delete(accountTable)
  await db.delete(verificationTable)
  await db.delete(userTable)

  // Demo user via Better-Auth (handles password hashing + account row)
  await auth.api.signUpEmail({
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME },
  })
  console.log(`Demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)

  const insertedStaff = await db
    .insert(staff)
    .values([
      { name: 'Andrea Méndez', role: 'Médica general', initials: 'AM', avatarGradient: 'linear-gradient(135deg,#c5d2ff,#dfe6ff)', rooms: ['SALA 1', 'SALA 2'] },
      { name: 'Diego Vázquez', role: 'Especialista', initials: 'DV', avatarGradient: 'linear-gradient(135deg,#ffd5ee,#ffe6f4)', rooms: ['SALA 3'] },
      { name: 'Lucía Romero', role: 'Procedimientos', initials: 'LR', avatarGradient: 'linear-gradient(135deg,#fde2c5,#ffeed8)', rooms: ['QUIRÓFANO'] },
      { name: 'Tomás Castro', role: 'Consultas', initials: 'TC', avatarGradient: 'linear-gradient(135deg,#c4f0d8,#dff5e8)', rooms: ['SALA 2'] },
      { name: 'Sofía Aguilar', role: 'Médica general', initials: 'SA', avatarGradient: 'linear-gradient(135deg,#ffd1c5,#ffe2da)', rooms: ['SALA 1'] },
      { name: 'Joaquín Núñez', role: 'Diagnóstico', initials: 'JN', avatarGradient: 'linear-gradient(135deg,#e2d4ff,#efe5ff)', rooms: ['SALA 4'] },
    ])
    .returning()

  const insertedServices = await db
    .insert(services)
    .values([
      { name: 'Consulta general', durationMinutes: 30, kind: 'consulta' },
      { name: 'Seguimiento', durationMinutes: 30, kind: 'seguimiento' },
      { name: 'Procedimiento', durationMinutes: 60, kind: 'procedimiento' },
      { name: 'Bloqueo de mantenimiento', durationMinutes: 60, kind: 'bloqueo' },
    ])
    .returning()

  const insertedClients = await db
    .insert(clients)
    .values([
      { name: 'Andrea Méndez', email: 'andrea.m@example.com' },
      { name: 'Diego Vázquez', email: 'diego.v@example.com' },
      { name: 'Lucía Romero', email: 'lucia.r@example.com' },
      { name: 'Tomás Castro', email: 'tomas.c@example.com' },
    ])
    .returning()

  const consulta = insertedServices.find((s) => s.kind === 'consulta')!
  const seg = insertedServices.find((s) => s.kind === 'seguimiento')!
  const proc = insertedServices.find((s) => s.kind === 'procedimiento')!

  const today = '2026-05-02'
  await db.insert(appointments).values([
    {
      date: today,
      startTime: '08:30',
      endTime: '09:00',
      label: 'Andrea Méndez · Control trimestral',
      kind: 'consulta',
      staffId: insertedStaff[0].id,
      clientId: insertedClients[0].id,
      serviceId: consulta.id,
      room: 'Sala 2',
    },
    {
      date: today,
      startTime: '10:00',
      endTime: '10:45',
      label: 'Diego Vázquez · Evaluación inicial',
      kind: 'seguimiento',
      staffId: insertedStaff[1].id,
      clientId: insertedClients[1].id,
      serviceId: seg.id,
      room: 'Sala 1',
    },
    {
      date: today,
      startTime: '13:00',
      endTime: '13:30',
      label: 'Lucía Romero · Procedimiento',
      kind: 'procedimiento',
      staffId: insertedStaff[2].id,
      clientId: insertedClients[2].id,
      serviceId: proc.id,
      room: 'Sala 3',
    },
    {
      date: today,
      startTime: '16:00',
      endTime: '16:45',
      label: 'Tomás Castro · Consulta',
      kind: 'consulta',
      staffId: insertedStaff[3].id,
      clientId: insertedClients[3].id,
      serviceId: consulta.id,
      room: 'Sala 2',
    },
  ])

  console.log(
    `Inserted ${insertedStaff.length} staff, ${insertedServices.length} services, ${insertedClients.length} clients, 4 appointments, 1 demo user.`,
  )
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
