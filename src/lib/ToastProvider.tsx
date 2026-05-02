import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastCtx } from './toastContext.ts'
import type { Toast, ToastApi, ToastTone } from './toastContext.ts'

const DEFAULT_DURATION = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<Toast>>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((arr) => arr.filter((t) => t.id !== id))
    const tm = timers.current.get(id)
    if (tm) {
      clearTimeout(tm)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((arr) => [...arr, { id, ...t }])
      const tm = setTimeout(() => dismiss(id), DEFAULT_DURATION)
      timers.current.set(id, tm)
    },
    [dismiss],
  )

  const make = useCallback(
    (tone: ToastTone) => (title: string, description?: string) =>
      push({ tone, title, description }),
    [push],
  )

  const api = useMemo<ToastApi>(
    () => ({
      toasts,
      push,
      dismiss,
      success: make('success'),
      error: make('error'),
      info: make('info'),
    }),
    [toasts, push, dismiss, make],
  )

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ReadonlyArray<Toast>
  onDismiss: (id: string) => void
}) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast tone-${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.description && <div className="toast-desc">{t.description}</div>}
          </div>
          <button
            type="button"
            className="toast-close"
            aria-label="Descartar"
            onClick={() => onDismiss(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
