import { useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PortalShell } from '../components/PortalShell.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api, ApiError } from '../lib/api.ts'
import { useToast } from '../lib/useToast.ts'
import type { Service } from '../db/schema.ts'

export const Route = createFileRoute('/portal/book')({ component: BookPage })

const KIND_LABEL: Record<Service['kind'], string> = {
  consulta: 'Consulta',
  seguimiento: 'Seguimiento',
  procedimiento: 'Procedimiento',
  bloqueo: 'Bloqueo',
}

function todayPlus(days: number) {
  // Anchored to the seed window (May 2026) so the wizard surfaces real
  // availability against the seeded calendar even if the wall clock
  // disagrees.
  const base = new Date('2026-05-02T00:00:00')
  base.setDate(base.getDate() + days)
  return base.toISOString().slice(0, 10)
}

function BookPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [staffId, setStaffId] = useState<string | null>(null)
  const [date, setDate] = useState(todayPlus(1))
  const [startTime, setStartTime] = useState<string | null>(null)

  const servicesQ = useQuery({ queryKey: ['portal', 'services'], queryFn: () => api.portalServices() })
  const staffQ = useQuery({ queryKey: ['portal', 'staff'], queryFn: () => api.portalStaff() })

  const selectedService = useMemo(
    () => servicesQ.data?.find((s) => s.id === serviceId) ?? null,
    [servicesQ.data, serviceId],
  )
  const selectedStaff = useMemo(
    () => staffQ.data?.find((s) => s.id === staffId) ?? null,
    [staffQ.data, staffId],
  )

  const slotsQ = useQuery({
    queryKey: ['portal', 'availability', staffId, date, selectedService?.id],
    queryFn: () =>
      api.portalAvailability({
        staffId: staffId!,
        date,
        durationMinutes: selectedService!.durationMinutes,
      }),
    enabled: step === 2 && Boolean(staffId) && Boolean(selectedService),
  })

  const bookMut = useMutation({
    mutationFn: () =>
      api.portalBook({
        serviceId: serviceId!,
        staffId: staffId!,
        date,
        startTime: startTime!,
      }),
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ['portal', 'appointments'] })
      toast.success('Cita reservada', `${date} · ${startTime}`)
      // Best-effort local reminder. The helper is mobile-only and
      // dynamically imported so it disappears from the web bundle.
      void scheduleReminderIfMobile(booking)
      navigate({ to: '/portal' })
    },
    onError: (e) => {
      toast.error(
        'No pudimos reservar',
        e instanceof ApiError ? e.message : undefined,
      )
    },
  })

  return (
    <PortalShell active="book">
      <section className="portal-hero">
        <h1>Reservar cita</h1>
        <p>Tres pasos: servicio, persona y horario.</p>
      </section>

      <Stepper step={step} />

      {step === 1 && (
        <Step1
          loading={servicesQ.isPending}
          services={servicesQ.data ?? []}
          selected={serviceId}
          onPick={(id) => {
            setServiceId(id)
            setStep(2)
            setStartTime(null)
          }}
        />
      )}

      {step === 2 && selectedService && (
        <Step2
          staff={staffQ.data ?? []}
          loading={staffQ.isPending}
          selectedStaffId={staffId}
          onPickStaff={(id) => {
            setStaffId(id)
            setStartTime(null)
          }}
          date={date}
          onPickDate={(d) => {
            setDate(d)
            setStartTime(null)
          }}
          startTime={startTime}
          onPickSlot={setStartTime}
          slots={slotsQ.data?.slots}
          slotsLoading={slotsQ.isFetching}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && selectedService && selectedStaff && startTime && (
        <Step3
          service={selectedService}
          staffName={selectedStaff.name}
          staffRole={selectedStaff.role}
          date={date}
          startTime={startTime}
          onBack={() => setStep(2)}
          onConfirm={() => bookMut.mutate()}
          submitting={bookMut.isPending}
        />
      )}
    </PortalShell>
  )
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: 'Servicio' },
    { n: 2, label: 'Horario' },
    { n: 3, label: 'Confirmar' },
  ] as const
  return (
    <ol className="book-stepper">
      {items.map((it) => (
        <li
          key={it.n}
          className={
            'book-step ' +
            (step === it.n ? 'current' : step > it.n ? 'done' : 'pending')
          }
        >
          <span className="num">{it.n}</span>
          <span className="lbl">{it.label}</span>
        </li>
      ))}
    </ol>
  )
}

function Step1({
  loading,
  services,
  selected,
  onPick,
}: {
  loading: boolean
  services: Array<Service>
  selected: string | null
  onPick: (id: string) => void
}) {
  if (loading) {
    return <div className="portal-empty">Cargando servicios…</div>
  }
  if (services.length === 0) {
    return <div className="portal-empty">No hay servicios disponibles para reservar.</div>
  }
  return (
    <div className="book-grid">
      {services.map((s) => (
        <button
          key={s.id}
          type="button"
          className={'book-tile' + (selected === s.id ? ' picked' : '')}
          onClick={() => onPick(s.id)}
        >
          <span className={`badge ${kindBadge(s.kind)}`}>
            <span className="dot" />
            {KIND_LABEL[s.kind]}
          </span>
          <span className="book-tile-title">{s.name}</span>
          <span className="book-tile-meta">{s.durationMinutes} min</span>
        </button>
      ))}
    </div>
  )
}

function Step2(props: {
  staff: Array<{ id: string; name: string; role: string; initials: string; avatarGradient: string }>
  loading: boolean
  selectedStaffId: string | null
  onPickStaff: (id: string) => void
  date: string
  onPickDate: (d: string) => void
  startTime: string | null
  onPickSlot: (t: string) => void
  slots?: Array<{ startTime: string; endTime: string }>
  slotsLoading: boolean
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <div className="book-section">
        <h3 className="book-section-title">¿Con quién?</h3>
        {props.loading ? (
          <div className="portal-empty">Cargando…</div>
        ) : (
          <div className="book-grid">
            {props.staff.map((s) => (
              <button
                key={s.id}
                type="button"
                className={
                  'book-tile staff' + (props.selectedStaffId === s.id ? ' picked' : '')
                }
                onClick={() => props.onPickStaff(s.id)}
              >
                <span className="av" style={{ background: s.avatarGradient }}>
                  {s.initials}
                </span>
                <div>
                  <div className="book-tile-title">{s.name}</div>
                  <div className="book-tile-meta">{s.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="book-section">
        <h3 className="book-section-title">¿Qué día?</h3>
        <input
          type="date"
          className="input focus-ring"
          value={props.date}
          onChange={(e) => props.onPickDate(e.target.value)}
          style={{ maxWidth: 200 }}
        />
      </div>

      {props.selectedStaffId && (
        <div className="book-section">
          <h3 className="book-section-title">Horarios disponibles</h3>
          {props.slotsLoading ? (
            <div className="portal-empty">Buscando huecos…</div>
          ) : !props.slots || props.slots.length === 0 ? (
            <div className="portal-empty">
              No hay horarios libres para esta combinación. Prueba con otra
              persona u otro día.
            </div>
          ) : (
            <div className="book-slots">
              {props.slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  className={
                    'book-slot' + (props.startTime === slot.startTime ? ' picked' : '')
                  }
                  onClick={() => props.onPickSlot(slot.startTime)}
                >
                  {slot.startTime.slice(0, 5)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="book-actions">
        <button type="button" className="btn-soft" onClick={props.onBack}>← Atrás</button>
        <button
          type="button"
          className="btn-grad"
          onClick={props.onNext}
          disabled={!props.selectedStaffId || !props.startTime}
        >
          Continuar →
        </button>
      </div>
    </>
  )
}

function Step3(props: {
  service: Service
  staffName: string
  staffRole: string
  date: string
  startTime: string
  onBack: () => void
  onConfirm: () => void
  submitting: boolean
}) {
  const niceDate = new Date(`${props.date}T00:00:00`).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  return (
    <>
      <div className="book-summary">
        <SummaryRow label="Servicio" value={`${props.service.name} (${props.service.durationMinutes} min)`} />
        <SummaryRow label="Tipo" value={KIND_LABEL[props.service.kind]} />
        <SummaryRow label="Persona" value={`${props.staffName} · ${props.staffRole}`} />
        <SummaryRow label="Día" value={niceDate} />
        <SummaryRow label="Hora" value={props.startTime.slice(0, 5)} />
      </div>

      <div className="book-actions">
        <button type="button" className="btn-soft" onClick={props.onBack}>← Atrás</button>
        <Link to="/portal" className="btn-soft">Cancelar</Link>
        <button
          type="button"
          className="btn-grad"
          onClick={props.onConfirm}
          disabled={props.submitting}
        >
          {props.submitting ? 'Reservando…' : (
            <>
              {NavIcon.check} Confirmar reserva
            </>
          )}
        </button>
      </div>
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="book-summary-row">
      <span className="lbl">{label}</span>
      <span className="val">{value}</span>
    </div>
  )
}

function kindBadge(k: Service['kind']) {
  return k === 'consulta'
    ? 'accent'
    : k === 'seguimiento'
    ? 'success'
    : k === 'procedimiento'
    ? 'warning'
    : 'danger'
}

// Side effect for the mobile bundle: schedule a local notification 1h
// before the appointment. The mobile entry registers the implementation
// on window at boot — see mobile/src/main.tsx. On the web bundle the
// hook is never set, so this is a no-op.
type ReminderHook = (b: {
  id: string
  date: string
  startTime: string
  label: string
}) => Promise<void> | void

declare global {
  interface Window {
    __attsoft_schedule_reminder?: ReminderHook
  }
}

async function scheduleReminderIfMobile(booking: {
  id: string
  date: string
  startTime: string
  label: string
}) {
  try {
    await window.__attsoft_schedule_reminder?.(booking)
  } catch (err) {
    console.warn('[notifications] schedule failed:', err)
  }
}
