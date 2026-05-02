import { createContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  tone: ToastTone
  title: string
  description?: string
}

export interface ToastApi {
  toasts: ReadonlyArray<Toast>
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

export const ToastCtx = createContext<ToastApi | null>(null)
