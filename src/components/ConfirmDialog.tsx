import { useState } from 'react'
import { Modal } from './Modal.tsx'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos completar la acción')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      <div className="modal-body">
        {description && (
          <p style={{ margin: 0, color: 'var(--app-body)', fontSize: 14, lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        {error && (
          <div
            role="alert"
            style={{
              fontSize: 13,
              color: 'var(--danger)',
              background: 'var(--danger-bg)',
              border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-2)',
            }}
          >
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-soft" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? 'btn-danger' : 'btn-grad'}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
