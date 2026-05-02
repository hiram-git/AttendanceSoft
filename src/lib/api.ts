import type {
  Staff,
  StaffAvailability,
  Service,
  Client,
  Appointment,
} from '../db/schema.ts'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let body: unknown = null
    let message = `API ${res.status}`
    const ct = res.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) {
      body = await res.json().catch(() => null)
      if (
        body &&
        typeof body === 'object' &&
        'message' in body &&
        typeof body.message === 'string'
      ) {
        message = body.message
      }
    } else {
      const text = await res.text()
      if (text) message = text
    }
    throw new ApiError(res.status, message, body)
  }
  return res.json()
}

const json = (method: 'POST' | 'PATCH', body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
})

const del = (): RequestInit => ({ method: 'DELETE' })

export type StaffInput = Omit<Staff, 'id'>
export type ServiceInput = Omit<Service, 'id'>
export type ClientInput = Omit<Client, 'id' | 'createdAt'>
export type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'status'> & {
  status?: Appointment['status']
}

export const api = {
  // Staff
  staff: () => http<Array<Staff>>('/api/staff'),
  createStaff: (b: StaffInput) => http<Staff>('/api/staff', json('POST', b)),
  updateStaff: (id: string, b: Partial<StaffInput>) =>
    http<Staff>(`/api/staff/${id}`, json('PATCH', b)),
  deleteStaff: (id: string) => http<{ ok: true }>(`/api/staff/${id}`, del()),

  // Staff availability (one row per weekday × staff)
  staffAvailability: (id: string) =>
    http<Array<StaffAvailability>>(`/api/staff/${id}/availability`),
  setStaffAvailability: (
    id: string,
    rows: Array<{ weekday: number; startTime: string; endTime: string }>,
  ) =>
    http<Array<StaffAvailability>>(`/api/staff/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify(rows),
    }),

  // Services
  services: () => http<Array<Service>>('/api/services'),
  createService: (b: ServiceInput) => http<Service>('/api/services', json('POST', b)),
  updateService: (id: string, b: Partial<ServiceInput>) =>
    http<Service>(`/api/services/${id}`, json('PATCH', b)),
  deleteService: (id: string) => http<{ ok: true }>(`/api/services/${id}`, del()),

  // Clients
  clients: () => http<Array<Client>>('/api/clients'),
  createClient: (b: ClientInput) => http<Client>('/api/clients', json('POST', b)),
  updateClient: (id: string, b: Partial<ClientInput>) =>
    http<Client>(`/api/clients/${id}`, json('PATCH', b)),
  deleteClient: (id: string) => http<{ ok: true }>(`/api/clients/${id}`, del()),

  // Appointments
  appointments: (params?: { date?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams()
    if (params?.date) qs.set('date', params.date)
    if (params?.from) qs.set('from', params.from)
    if (params?.to) qs.set('to', params.to)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return http<Array<Appointment>>(`/api/appointments${suffix}`)
  },
  createAppointment: (b: AppointmentInput) =>
    http<Appointment>('/api/appointments', json('POST', b)),
  updateAppointment: (id: string, b: Partial<AppointmentInput>) =>
    http<Appointment>(`/api/appointments/${id}`, json('PATCH', b)),
  deleteAppointment: (id: string) =>
    http<{ ok: true }>(`/api/appointments/${id}`, del()),
}
