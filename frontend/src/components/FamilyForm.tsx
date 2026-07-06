import { useState, useEffect } from 'react'
import type { Person, Family } from '../types'

interface Props {
  open: boolean
  treeId: string
  people: Record<string, Person>
  family: Family | null
  onSave: (data: { parent1Id?: string; parent2Id?: string; childrenIds: string[]; marriageDate?: string; divorceDate?: string }) => void
  onDelete?: () => void
  onClose: () => void
}

export default function FamilyForm({ open, people, family, onSave, onDelete, onClose }: Props) {
  const personList = Object.values(people)
  const [parent1Id, setParent1Id] = useState('')
  const [parent2Id, setParent2Id] = useState('')
  const [childrenIds, setChildrenIds] = useState<string[]>([])
  const [marriageDate, setMarriageDate] = useState('')
  const [divorceDate, setDivorceDate] = useState('')

  useEffect(() => {
    setParent1Id(family?.parent1Id ?? '')
    setParent2Id(family?.parent2Id ?? '')
    setChildrenIds(family?.childrenIds ?? [])
    setMarriageDate(family?.marriageDate ?? '')
    setDivorceDate(family?.divorceDate ?? '')
  }, [family, open])

  const toggleChild = (id: string) => {
    setChildrenIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  const handleSave = () => {
    onSave({ parent1Id: parent1Id || undefined, parent2Id: parent2Id || undefined, childrenIds, marriageDate: marriageDate || undefined, divorceDate: divorceDate || undefined })
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h2>{family ? 'Modifier la famille' : 'Nouvelle famille'}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-row">
            <div className="input-group">
              <select value={parent1Id} onChange={(e) => setParent1Id(e.target.value)}>
                <option value="">Parent 1</option>
                {personList.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div className="input-group">
              <select value={parent2Id} onChange={(e) => setParent2Id(e.target.value)}>
                <option value="">Parent 2</option>
                {personList.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <input type="date" value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} placeholder="Date mariage" />
            </div>
            <div className="input-group">
              <input type="date" value={divorceDate} onChange={(e) => setDivorceDate(e.target.value)} placeholder="Date divorce" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Enfants</div>
            <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 12, padding: 8 }}>
              {personList.map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 14, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input type="checkbox" checked={childrenIds.includes(p.id)} onChange={() => toggleChild(p.id)} />
                  {p.firstName} {p.lastName}
                </label>
              ))}
              {personList.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Ajoutez d'abord des personnes</span>}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          {onDelete && <button className="btn btn-sm btn-danger" onClick={onDelete}>Supprimer</button>}
          {!onDelete && <div />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={onClose}>Annuler</button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
