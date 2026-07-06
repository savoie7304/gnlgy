import { useEffect, useRef } from 'react'

interface ParentInfo {
  id: string
  label: string
}

interface Props {
  open: boolean
  x: number
  y: number
  onClose: () => void
  onAction: (action: string) => void
  hasParent: boolean
  hasPartner: boolean
  hasChildren: boolean
  hasSiblings: boolean
  parents?: ParentInfo[]
}

export default function ActionMenu({ open, x, y, onClose, onAction, parents }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [open, onClose])

  if (!open) return null

  const mx = Math.min(x, window.innerWidth - 230)
  const my = Math.min(y, window.innerHeight - 420)

  const bothParentsDisabled = parents !== undefined && parents.length === 2

  const groups: { label: string; action: string; icon: string }[][] = [
    [
      ...(!bothParentsDisabled
        ? [{ label: 'Ajouter les deux parents', action: 'add-both-parents', icon: '👫' }]
        : []),
      { label: 'Ajouter un père', action: 'add-father', icon: '♂' },
      { label: 'Ajouter une mère', action: 'add-mother', icon: '♀' },
    ],
    [
      { label: 'Ajouter un(e) conjoint(e)', action: 'add-spouse', icon: '💑' },
      { label: 'Ajouter un enfant', action: 'add-child', icon: '👶' },
    ],
    [
      { label: 'Ajouter un frère/une soeur', action: 'add-sibling', icon: '👥' },
      ...(parents && parents.length >= 2
        ? parents.map((p) => ({
            label: `Demi-frère/soeur via ${p.label}`,
            action: `add-half-sibling:${p.id}`,
            icon: '👤',
          }))
        : [{ label: 'Ajouter un demi-frère/soeur', action: 'add-half-sibling', icon: '👤' }]
      ),
      { label: 'Ajouter un cousin/une cousine', action: 'add-cousin', icon: '🌳' },
    ],
    [
      { label: 'Modifier', action: 'edit', icon: '✏️' },
      { label: 'Supprimer', action: 'delete', icon: '🗑️' },
    ],
  ]

  return (
    <div className="action-menu" ref={menuRef} style={{ left: mx, top: Math.max(my, 8) }}>
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="action-menu-divider" />}
          {group.map((item) => (
            <button
              key={item.action}
              className="action-menu-item"
              onClick={(e) => { e.stopPropagation(); onAction(item.action) }}
            >
              <span style={{ width: 22, display: 'inline-block', textAlign: 'center', fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
