import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const SIZE: Record<NonNullable<Props['size']>, number> = {
  sm: 420,
  md: 560,
  lg: 720,
}

export function Modal({ open, onOpenChange, title, subtitle, size = 'md', children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
    >
      <div
        className="modal-card card elevated"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: SIZE[size] }}
      >
        <div className="card-head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h3>{title}</h3>
            {subtitle && <span className="sub">{subtitle}</span>}
          </div>
          <button
            className="icon-btn"
            style={{ marginLeft: 'auto' }}
            aria-label="Cerrar"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
