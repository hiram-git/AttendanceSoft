import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from './Modal.tsx'
import { api } from '../lib/api.ts'
import type { Staff } from '../db/schema.ts'

interface Props {
  staff: Staff | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface DayState {
  enabled: boolean
  start: string
  end: string
}

const EMPTY_WEEK: Array<DayState> = Array.from({ length: 7 }, () => ({
  enabled: false,
  start: '09:00',
  end: '18:00',
}))

function trimSeconds(t: string) {
  return t.length > 5 ? t.slice(0, 5) : t
}

export function AvailabilityEditor({ staff, open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const [week, setWeek] = useState<Array<DayState>>(EMPTY_WEEK)
  const [error, setError] = useState<string | null>(null)

  const availabilityQuery = useQuery({
    queryKey: ['staff-availability', staff?.id],
    queryFn: () => (staff ? api.staffAvailability(staff.id) : Promise.resolve([])),
    enabled: open && staff !== null,
  })

  const saveMut = useMutation({
    mutationFn: (rows: Array<{ weekday: number; startTime: string; endTime: string }>) => {
      if (!staff) throw new Error('No staff selected')
      return api.setStaffAvailability(staff.id, rows)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-availability', staff?.id] })
    },
  })

  // Hydrate state from server data when it arrives.
  useEffect(() => {
    if (!availabilityQuery.data) return
    const next = EMPTY_WEEK.map((d) => ({ ...d }))
    for (const row of availabilityQuery.data) {
      next[row.weekday] = {
        enabled: true,
        start: trimSeconds(row.startTime),
        end: trimSeconds(row.endTime),
      }
    }
    setWeek(next)
    setError(null)
  }, [availabilityQuery.data])

  function patchDay(i: number, patch: Partial<DayState>) {
    setWeek((w) => w.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
  }

  async function handleSave() {
    setError(null)
    for (const [i, d] of week.entries()) {
      if (d.enabled && d.end <= d.start) {
        setError(`${WEEKDAYS[i]}: la hora de fin debe ser posterior a la de inicio.`)
        return
      }
    }
    const rows = week
      .map((d, i) =>
        d.enabled
          ? { weekday: i, startTime: d.start, endTime: d.end }
          : null,
      )
      .filter((r): r is NonNullable<typeof r> => r !== null)
    try {
      await saveMut.mutateAsync(rows)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar')
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={staff ? `Disponibilidad · ${staff.name}` : 'Disponibilidad'}
      subtitle="Define las horas habituales por día de la semana"
      size="md"
    >
      <div className="modal-body">
        {availabilityQuery.isPending ? (
          <div style={{ color: 'var(--app-muted)', fontSize: 13 }}>Cargando…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {week.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 1fr',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-2)',
                  background: d.enabled ? 'var(--app-surface)' : 'var(--app-surface-2)',
                  border: '1px solid var(--app-border)',
                }}
              >
                <label className="checkbox" style={{ gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => patchDay(i, { enabled: e.target.checked })}
                  />
                  <span className="box">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{WEEKDAYS[i]}</span>
                </label>

                <input
                  className="input focus-ring"
                  type="time"
                  value={d.start}
                  disabled={!d.enabled}
                  onChange={(e) => patchDay(i, { start: e.target.value })}
                  style={{ height: 32 }}
                />
                <input
                  className="input focus-ring"
                  type="time"
                  value={d.end}
                  disabled={!d.enabled}
                  onChange={(e) => patchDay(i, { end: e.target.value })}
                  style={{ height: 32 }}
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div role="alert" style={{
            fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)',
            border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)',
            padding: '8px 12px', borderRadius: 'var(--radius-2)',
          }}>{error}</div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-soft" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-grad"
            onClick={handleSave}
            disabled={saveMut.isPending}
          >
            {saveMut.isPending ? 'Guardando…' : 'Guardar disponibilidad'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
