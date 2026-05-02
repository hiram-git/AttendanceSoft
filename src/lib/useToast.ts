import { useContext } from 'react'
import { ToastCtx } from './toastContext.ts'

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast outside ToastProvider')
  return ctx
}
