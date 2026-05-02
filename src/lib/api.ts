import type { Staff, Service, Client, Appointment } from '../db/schema.ts'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  staff: () => http<Array<Staff>>('/api/staff'),
  services: () => http<Array<Service>>('/api/services'),
  clients: () => http<Array<Client>>('/api/clients'),
  appointments: (params?: { date?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams()
    if (params?.date) qs.set('date', params.date)
    if (params?.from) qs.set('from', params.from)
    if (params?.to) qs.set('to', params.to)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return http<Array<Appointment>>(`/api/appointments${suffix}`)
  },
  createAppointment: (body: Omit<Appointment, 'id' | 'createdAt' | 'status'>) =>
    http<Appointment>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
