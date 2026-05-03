import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Modal } from './Modal.tsx'
import { api, ApiError } from '../lib/api.ts'
import { useToast } from '../lib/useToast.ts'
import type { Client } from '../db/schema.ts'

interface Props {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvitationDialog({ client, open, onOpenChange }: Props) {
  const toast = useToast()
  const [url, setUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const createMut = useMutation({
    mutationFn: (id: string) => api.createClientInvitation(id),
    onSuccess: (inv) => {
      setUrl(inv.url)
      setExpiresAt(inv.expiresAt)
      setError(null)
    },
    onError: (e) => {
      setError(e instanceof ApiError ? e.message : 'No pudimos crear la invitación')
      setUrl(null)
    },
  })

  // Auto-request an invitation the first time this dialog opens for a
  // given client. The ref guard is what actually breaks the loop:
  // `createMut` is recreated on every render, so even if the effect
  // re-fires, we only call mutate when the (open, clientId) tuple
  // changes — never on a re-render caused by the mutation's own
  // setState (which would generate infinite tokens otherwise).
  const requestedFor = useRef<string | null>(null)
  const clientId = client?.id ?? null
  useEffect(() => {
    if (!open) {
      requestedFor.current = null
      return
    }
    if (!clientId || requestedFor.current === clientId) return
    requestedFor.current = clientId
    setUrl(null)
    setExpiresAt(null)
    setError(null)
    setCopied(false)
    createMut.mutate(clientId)
  }, [open, clientId, createMut])

  async function handleCopy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copiado al portapapeles')
      setTimeout(() => setCopied(false), 2400)
    } catch {
      toast.error('No pudimos copiar el link')
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={client ? `Invitar a ${client.name}` : 'Invitar al portal'}
      subtitle="Genera un link para que el cliente cree su cuenta"
    >
      <div className="modal-body">
        {createMut.isPending && (
          <p style={{ margin: 0, color: 'var(--app-muted)', fontSize: 13 }}>
            Generando link…
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

        {url && (
          <>
            <p style={{ margin: 0, color: 'var(--app-body)', fontSize: 14, lineHeight: 1.5 }}>
              Comparte este link con el cliente. Cuando lo abra, podrá fijar
              su contraseña y entrar al portal con la cuenta ya vinculada.
            </p>

            <div className="field">
              <label className="field-label">Link de invitación</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input focus-ring"
                  type="text"
                  readOnly
                  value={url}
                  onFocus={(e) => e.target.select()}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
                <button
                  type="button"
                  className={copied ? 'btn-soft' : 'btn-grad'}
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {expiresAt && (
              <p style={{ margin: 0, color: 'var(--app-muted)', fontSize: 12.5 }}>
                Expira el{' '}
                <strong style={{ color: 'var(--app-body)' }}>
                  {new Date(expiresAt).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </strong>
                . Si necesitas renovarlo, vuelve a generar uno nuevo desde
                este mismo botón.
              </p>
            )}
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-soft" onClick={() => onOpenChange(false)}>
            Cerrar
          </button>
          {url && client && (
            <button
              type="button"
              className="btn-soft"
              onClick={() => createMut.mutate(client.id)}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? 'Generando…' : 'Generar nuevo'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
