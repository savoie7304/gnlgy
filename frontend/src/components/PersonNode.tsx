import type { Person, LayoutPosition } from '../types'
import { NODE_W, NODE_H } from '../utils/treeLayout'
import { formatDisplayDate } from '../utils/formatDate'

interface Props {
  person: Person
  pos: LayoutPosition
  isSelected: boolean
  isOver?: boolean
  onClick: () => void
  onDoubleClick?: () => void
  onActionMenu: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

const SYM = 44

export default function PersonNode({ person, pos, isSelected, isOver, onClick, onDoubleClick, onActionMenu, onMouseDown }: Props) {
  const isDeceased = !!person.deathDate
  const color = person.gender === 'male' ? '#3b82f6' : person.gender === 'female' ? '#ec4899' : '#94a3b8'
  const fill = isSelected ? color : 'white'
  const strokeColor = isSelected ? color : (isDeceased ? '#94a3b8' : color)
  const textColor = isSelected ? 'white' : 'var(--text-primary)'
  const mutedColor = isSelected ? textColor : 'var(--text-muted)'

  const cx = NODE_W / 2
  const symY = 6

  const renderSymbol = () => {
    if (person.gender === 'male') {
      return <rect x={cx - SYM / 2} y={symY} width={SYM} height={SYM} rx="4" fill={fill} stroke={strokeColor} strokeWidth={2.5} />
    }
    if (person.gender === 'female') {
      return <circle cx={cx} cy={symY + SYM / 2} r={SYM / 2} fill={fill} stroke={strokeColor} strokeWidth={2.5} />
    }
    return (
      <polygon
        points={`${cx},${symY} ${cx + SYM / 2},${symY + SYM / 2} ${cx},${symY + SYM} ${cx - SYM / 2},${symY + SYM / 2}`}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={2.5}
      />
    )
  }

  const renderDeceased = () => {
    if (!isDeceased) return null
    if (person.gender === 'male') {
      return <line x1={cx - SYM / 2} y1={symY} x2={cx + SYM / 2} y2={symY + SYM} stroke="#94a3b8" strokeWidth={2} />
    }
    if (person.gender === 'female') {
      const a = SYM / 2
      return <line x1={cx - a * 0.7} y1={symY + a - a * 0.7} x2={cx + a * 0.7} y2={symY + a + a * 0.7} stroke="#94a3b8" strokeWidth={2} />
    }
    return <line x1={cx - SYM / 2} y1={symY} x2={cx + SYM / 2} y2={symY + SYM} stroke="#94a3b8" strokeWidth={2} />
  }

  return (
    <g
      className={`person-node ${isSelected ? 'selected' : ''}`}
      transform={`translate(${pos.x}, ${pos.y})`}
    >
      {renderSymbol()}
      {renderDeceased()}

      <text x={cx} y={symY + SYM + 14} textAnchor="middle" fill={textColor} fontSize="12" fontWeight="600">
        {person.firstName || 'Prénom'}
      </text>
      <text x={cx} y={symY + SYM + 26} textAnchor="middle" fill={isSelected ? textColor : 'var(--text-secondary)'} fontSize="11" fontWeight="400">
        {person.lastName || 'NOM'}
      </text>

      {person.birthDate ? (
        <text x={cx} y={symY + SYM + 39} textAnchor="middle" fill={mutedColor} fontSize="9">
          {formatDisplayDate(person.birthDate)}{person.deathDate ? ` - ${formatDisplayDate(person.deathDate)}` : ''}
        </text>
      ) : person.deathDate ? (
        <text x={cx} y={symY + SYM + 39} textAnchor="middle" fill={mutedColor} fontSize="9">
          † {formatDisplayDate(person.deathDate)}
        </text>
      ) : null}

      {/* Highlight on drag-over */}
      {isOver && (
        <rect x={-3} y={-3} width={NODE_W + 6} height={NODE_H + 6} rx="10" fill="none" stroke="#3b82f6" strokeWidth={3} strokeDasharray="6 4" />
      )}

      <rect
        x={4} y={0} width={NODE_W - 8} height={NODE_H - 4}
        fill="transparent" rx="8"
        style={{ cursor: 'pointer' }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onActionMenu(e) }}
      />

      <g
        transform={`translate(${NODE_W - 28}, ${NODE_H / 2})`}
        style={{ cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onActionMenu(e) }}
      >
        <circle cx="12" cy="0" r="12" fill="var(--bg-primary)" stroke="var(--border-color)" strokeWidth="1" />
        <text x="12" y="4" textAnchor="middle" fill="var(--text-secondary)" fontSize="15" fontWeight="bold">⋯</text>
      </g>
    </g>
  )
}
