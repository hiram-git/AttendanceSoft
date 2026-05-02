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
  const bloqueo = insertedServices.find((s) => s.kind === 'bloqueo')!

  type Kind = 'consulta' | 'seguimiento' | 'procedimiento' | 'bloqueo'
  const serviceFor = (k: Kind) =>
    k === 'consulta' ? consulta.id
      : k === 'seguimiento' ? seg.id
      : k === 'procedimiento' ? proc.id
      : bloqueo.id

  // Day → list of appointments, mirroring the calendar mock for May 2026.
  const monthSeed: Record<number, Array<{
    t: string; e: string; l: string; k: Kind; s: number; c: number; r?: string
  }>> = {
    1:  [{ t: '09:00', e: '09:30', l: 'Pérez · Consulta', k: 'consulta', s: 0, c: 0, r: 'Sala 1' },
         { t: '11:30', e: '12:00', l: 'Soto · Limpieza', k: 'seguimiento', s: 1, c: 1, r: 'Sala 1' }],
    2:  [{ t: '08:30', e: '09:00', l: 'Andrea Méndez · Control trimestral', k: 'consulta', s: 0, c: 0, r: 'Sala 2' },
         { t: '10:00', e: '10:45', l: 'Diego Vázquez · Evaluación inicial', k: 'seguimiento', s: 1, c: 1, r: 'Sala 1' },
         { t: '13:00', e: '14:00', l: 'Lucía Romero · Procedimiento', k: 'procedimiento', s: 2, c: 2, r: 'Sala 3' },
         { t: '16:00', e: '16:45', l: 'Tomás Castro · Consulta', k: 'consulta', s: 3, c: 3, r: 'Sala 2' }],
    4:  [{ t: '09:00', e: '10:00', l: 'Equipo A · Estudio', k: 'procedimiento', s: 2, c: 0, r: 'Quirófano' },
         { t: '14:00', e: '14:30', l: 'Núñez · Consulta', k: 'consulta', s: 5, c: 1 }],
    5:  [{ t: '08:00', e: '08:30', l: 'Garza · Seguimiento', k: 'seguimiento', s: 0, c: 0 },
         { t: '11:00', e: '11:30', l: 'Salinas · Consulta', k: 'consulta', s: 4, c: 1 },
         { t: '15:30', e: '16:00', l: 'Vega · Consulta', k: 'consulta', s: 4, c: 2 }],
    6:  [{ t: '10:00', e: '11:00', l: 'Bloqueo · Mantenimiento sala 2', k: 'bloqueo', s: 3, c: 0, r: 'Sala 2' }],
    7:  [{ t: '09:30', e: '10:00', l: 'Aguilar · Consulta', k: 'consulta', s: 4, c: 0 },
         { t: '13:00', e: '13:30', l: 'Reyes · Seguimiento', k: 'seguimiento', s: 0, c: 1 },
         { t: '17:00', e: '18:00', l: 'Morales · Procedimiento', k: 'procedimiento', s: 2, c: 2 }],
    8:  [{ t: '08:30', e: '09:00', l: 'Gómez · Consulta', k: 'consulta', s: 0, c: 3 },
         { t: '12:00', e: '12:30', l: 'Rivas · Seguimiento', k: 'seguimiento', s: 1, c: 1 }],
    11: [{ t: '09:00', e: '09:30', l: 'Treviño · Consulta', k: 'consulta', s: 0, c: 0 },
         { t: '11:30', e: '12:00', l: 'Acuña · Consulta', k: 'consulta', s: 4, c: 1 }],
    12: [{ t: '10:00', e: '10:30', l: 'Ortiz · Revisión', k: 'seguimiento', s: 1, c: 2 }],
    13: [{ t: '09:00', e: '09:30', l: 'Beltrán · Consulta', k: 'consulta', s: 0, c: 3 },
         { t: '14:00', e: '15:00', l: 'Cano · Procedimiento', k: 'procedimiento', s: 2, c: 0 },
         { t: '16:30', e: '17:00', l: 'Solís · Consulta', k: 'consulta', s: 3, c: 1 }],
    14: [{ t: '08:00', e: '08:30', l: 'Quintero · Seguimiento', k: 'seguimiento', s: 0, c: 0 },
         { t: '11:00', e: '11:30', l: 'Lara · Consulta', k: 'consulta', s: 4, c: 1 },
         { t: '15:00', e: '16:00', l: 'Hidalgo · Bloqueo', k: 'bloqueo', s: 5, c: 2, r: 'Sala 4' },
         { t: '17:30', e: '18:00', l: 'Cuevas · Consulta', k: 'consulta', s: 3, c: 3 }],
    15: [{ t: '09:30', e: '10:00', l: 'Velasco · Consulta', k: 'consulta', s: 1, c: 0 }],
    18: [{ t: '10:00', e: '10:30', l: 'Moreno · Consulta', k: 'consulta', s: 0, c: 1 },
         { t: '13:00', e: '13:30', l: 'Paredes · Seguimiento', k: 'seguimiento', s: 1, c: 2 }],
    19: [{ t: '09:00', e: '09:30', l: 'Casas · Consulta', k: 'consulta', s: 0, c: 3 },
         { t: '12:30', e: '13:00', l: 'Ramos · Consulta', k: 'consulta', s: 4, c: 0 },
         { t: '15:00', e: '15:30', l: 'Tovar · Seguimiento', k: 'seguimiento', s: 1, c: 1 }],
    20: [{ t: '08:30', e: '09:30', l: 'Esparza · Procedimiento', k: 'procedimiento', s: 2, c: 2 }],
    21: [{ t: '09:00', e: '09:30', l: 'Ibarra · Consulta', k: 'consulta', s: 0, c: 0 },
         { t: '11:30', e: '12:00', l: 'Lugo · Seguimiento', k: 'seguimiento', s: 1, c: 1 },
         { t: '15:00', e: '15:30', l: 'Peña · Consulta', k: 'consulta', s: 4, c: 2 }],
    22: [{ t: '10:00', e: '10:30', l: 'Fuentes · Consulta', k: 'consulta', s: 0, c: 3 },
         { t: '14:00', e: '15:00', l: 'Barrios · Procedimiento largo', k: 'procedimiento', s: 2, c: 0 }],
    25: [{ t: '09:00', e: '09:30', l: 'Cervantes · Consulta', k: 'consulta', s: 0, c: 1 }],
    26: [{ t: '08:00', e: '08:30', l: 'Loera · Consulta', k: 'consulta', s: 0, c: 2 },
         { t: '11:00', e: '11:30', l: 'Sandoval · Seguimiento', k: 'seguimiento', s: 1, c: 3 },
         { t: '14:00', e: '14:30', l: 'Tapia · Consulta', k: 'consulta', s: 3, c: 0 },
         { t: '16:30', e: '17:00', l: 'Andrade · Consulta', k: 'consulta', s: 4, c: 1 }],
    27: [{ t: '09:30', e: '10:00', l: 'Bustos · Seguimiento', k: 'seguimiento', s: 0, c: 2 },
         { t: '13:00', e: '13:30', l: 'Avilés · Consulta', k: 'consulta', s: 4, c: 3 }],
    28: [{ t: '10:00', e: '11:00', l: 'Cordero · Bloqueo', k: 'bloqueo', s: 5, c: 0, r: 'Sala 4' },
         { t: '15:00', e: '15:30', l: 'Patiño · Consulta', k: 'consulta', s: 3, c: 1 }],
    29: [{ t: '09:00', e: '09:30', l: 'Jaramillo · Consulta', k: 'consulta', s: 0, c: 2 },
         { t: '11:00', e: '11:30', l: 'Ávalos · Seguimiento', k: 'seguimiento', s: 1, c: 3 },
         { t: '14:30', e: '15:00', l: 'Pineda · Consulta', k: 'consulta', s: 4, c: 0 }],
  }

  const rows = Object.entries(monthSeed).flatMap(([day, items]) => {
    const date = `2026-05-${day.padStart(2, '0')}`
    return items.map((it) => ({
      date,
      startTime: it.t,
      endTime: it.e,
      label: it.l,
      kind: it.k,
      staffId: insertedStaff[it.s % insertedStaff.length].id,
      clientId: insertedClients[it.c % insertedClients.length].id,
      serviceId: serviceFor(it.k),
      room: it.r ?? null,
    }))
  })
  await db.insert(appointments).values(rows)
  const totalAppts = rows.length

  console.log(
    `Inserted ${insertedStaff.length} staff, ${insertedServices.length} services, ${insertedClients.length} clients, ${totalAppts} appointments, 1 demo user.`,
  )
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
