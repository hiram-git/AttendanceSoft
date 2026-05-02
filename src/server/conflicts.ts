import { and, eq, ne, or } from 'drizzle-orm'
import { db } from '../db/index.ts'
import { appointments } from '../db/schema.ts'
import type { Appointment } from '../db/schema.ts'

export interface ConflictCandidate {
  date: string
  startTime: string
  endTime: string
  staffId?: string | null
  room?: string | null
  /** When updating an existing row, exclude it from conflict checks. */
  ignoreId?: string
}

export interface Conflict {
  scope: 'staff' | 'room'
  withId: string
  withLabel: string
  withTime: string
}

/**
 * Find appointments that overlap with the given candidate on the same date.
 * A conflict is reported when:
 *  - same staffId AND time overlaps, OR
 *  - same room (case-insensitive) AND time overlaps
 * Cancelled appointments are ignored.
 */
export async function findConflicts(c: ConflictCandidate): Promise<Array<Conflict>> {
  if (norm(c.endTime) <= norm(c.startTime)) return []

  const sameDate = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.date, c.date),
        c.ignoreId ? ne(appointments.id, c.ignoreId) : undefined,
        or(
          c.staffId ? eq(appointments.staffId, c.staffId) : undefined,
          c.room ? eq(appointments.room, c.room) : undefined,
        ),
      ),
    )

  const conflicts: Array<Conflict> = []
  for (const row of sameDate) {
    if (row.status === 'cancelada') continue
    if (!overlaps(c.startTime, c.endTime, row.startTime, row.endTime)) continue

    const withTime = `${row.startTime.slice(0, 5)}–${row.endTime.slice(0, 5)}`
    if (c.staffId && row.staffId === c.staffId) {
      conflicts.push({ scope: 'staff', withId: row.id, withLabel: row.label, withTime })
    }
    if (c.room && row.room && eqCaseInsensitive(row.room, c.room)) {
      conflicts.push({ scope: 'room', withId: row.id, withLabel: row.label, withTime })
    }
  }
  return conflicts
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return norm(aStart) < norm(bEnd) && norm(bStart) < norm(aEnd)
}

/** Normalise to HH:MM:SS so string comparison is stable regardless of input. */
function norm(t: string) {
  return t.length === 5 ? `${t}:00` : t
}

function eqCaseInsensitive(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function describeConflicts(conflicts: Array<Conflict>): string {
  const byScope = conflicts.reduce<Record<'staff' | 'room', Array<Conflict>>>(
    (acc, c) => {
      acc[c.scope].push(c)
      return acc
    },
    { staff: [], room: [] },
  )
  const parts: Array<string> = []
  if (byScope.staff.length > 0) {
    const c = byScope.staff[0]
    parts.push(`La persona ya tiene "${c.withLabel}" (${c.withTime}).`)
  }
  if (byScope.room.length > 0) {
    const c = byScope.room[0]
    parts.push(`La sala ya está ocupada por "${c.withLabel}" (${c.withTime}).`)
  }
  return parts.join(' ')
}

export type AppointmentRow = Appointment
