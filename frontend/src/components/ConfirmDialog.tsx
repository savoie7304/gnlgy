interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h2>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        <div className="modal-actions" style={{ border: 'none', paddingTop: 16, marginTop: 16 }}>
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={onCancel}>{cancelLabel}</button>
            <button className="btn btn-sm btn-danger" onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
