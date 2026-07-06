import type { Person } from '../types'

interface Props {
  open: boolean
  source: Person | null
  target: Person | null
  onLink: (type: 'spouse' | 'parent' | 'child' | 'sibling') => void
  onClose: () => void
}

export default function LinkDialog({ open, source, target, onLink, onClose }: Props) {
  if (!open || !source || !target) return null
  const sn = `${source.firstName || '?'} ${source.lastName || ''}`.trim()
  const tn = `${target.firstName || '?'} ${target.lastName || ''}`.trim()

  const options: { type: 'spouse' | 'parent' | 'child' | 'sibling'; label: string; hint: string; icon: string }[] = [
    { type: 'spouse', label: 'Conjoint(e)', hint: `${sn} et ${tn} en couple`, icon: '💑' },
    { type: 'parent', label: 'Parent', hint: `${sn} devient parent de ${tn}`, icon: '👴' },
    { type: 'child', label: 'Enfant', hint: `${tn} devient parent de ${sn}`, icon: '👶' },
    { type: 'sibling', label: 'Frère/Soeur', hint: `${sn} et ${tn} sont frères/soeurs`, icon: '👥' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Lier {sn} et {tn}</h2>
        <p style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
          Quel type de lien créer entre ces deux personnes ?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((opt) => (
            <button
              key={opt.type}
              className="action-menu-item"
              style={{ padding: '12px 16px', fontSize: 15 }}
              onClick={() => onLink(opt.type)}
            >
              <span style={{ marginRight: 10, fontSize: 18 }}>{opt.icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span>{opt.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{opt.hint}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-sm" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
