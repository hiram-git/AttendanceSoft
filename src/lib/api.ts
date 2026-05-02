import type { Staff, Service, Client, Appointment } from '../db/schema.ts'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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
  appointments: (date?: string) =>
    http<Array<Appointment>>(`/api/appointments${date ? `?date=${date}` : ''}`),
  createAppointment: (body: Omit<Appointment, 'id' | 'createdAt' | 'status'>) =>
    http<Appointment>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
