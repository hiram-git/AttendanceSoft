import type {
  Staff,
  StaffAvailability,
  Service,
  Client,
  Appointment,
  User,
} from '../db/schema.ts'

const BASE =
  import.meta.env.PUBLIC_API_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3001'

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

  // ───── Portal (cliente) ─────
  portalSignup: (b: { name: string; email: string; password: string; phone?: string }) =>
    http<{ user: User; token: string }>('/api/portal/signup', json('POST', b)),
  portalMe: () =>
    http<{ user: User; client: Client | null }>('/api/portal/me'),
  portalAppointments: () =>
    http<Array<Appointment>>('/api/portal/appointments'),
  portalServices: () => http<Array<Service>>('/api/portal/services'),
  portalStaff: () =>
    http<Array<Pick<Staff, 'id' | 'name' | 'role' | 'initials' | 'avatarGradient'>>>(
      '/api/portal/staff',
    ),
  portalAvailability: (params: { staffId: string; date: string; durationMinutes: number }) => {
    const qs = new URLSearchParams({
      staffId: params.staffId,
      date: params.date,
      durationMinutes: String(params.durationMinutes),
    })
    return http<{ slots: Array<{ startTime: string; endTime: string }> }>(
      `/api/portal/availability?${qs.toString()}`,
    )
  },
  portalBook: (b: { serviceId: string; staffId: string; date: string; startTime: string }) =>
    http<Appointment>('/api/portal/appointments', json('POST', b)),

  // Invitations (staff side)
  createClientInvitation: (clientId: string) =>
    http<{ id: string; token: string; expiresAt: string; url: string }>(
      `/api/clients/${clientId}/invitations`,
      json('POST', {}),
    ),

  // Invitations (client side, public)
  getInvitation: (token: string) =>
    http<{
      state: 'pending' | 'expired' | 'used'
      client: { id: string; name: string; email: string | null }
      expiresAt: string
    }>(`/api/portal/invitations/${token}`),
  acceptInvite: (b: { token: string; password: string }) =>
    http<{ user: User; token: string }>('/api/portal/accept-invite', json('POST', b)),
}
