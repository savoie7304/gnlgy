import type { LayoutPosition } from '../types'
import { NODE_W } from '../utils/treeLayout'

interface SpouseEdgeProps {
  pos1: LayoutPosition
  pos2: LayoutPosition
  dashed?: boolean
  familyId?: string
  onLineClick?: (familyId: string) => void
  onSpouseClick?: (familyId: string) => void
}

const SYM_CY = 28
const HIT_W = 20

export function SpouseEdge({ pos1, pos2, dashed, familyId, onLineClick, onSpouseClick }: SpouseEdgeProps) {
  const y = pos1.y + SYM_CY
  const x1 = pos1.x + NODE_W / 2
  const x2 = pos2.x + NODE_W / 2

  return (
    <g>
      {/* Invisible wider hit area — toggle dashed on click */}
      {familyId && onLineClick && (
        <line x1={x1} y1={y - HIT_W / 2} x2={x2} y2={y - HIT_W / 2} stroke="transparent" strokeWidth={HIT_W} style={{ cursor: 'pointer', pointerEvents: 'all' }} onClick={() => onLineClick(familyId)} />
      )}
      {/* Visible line */}
      <line
        x1={x1} y1={y} x2={x2} y2={y}
        stroke="#94a3b8" strokeWidth={2.5}
        strokeDasharray={dashed ? '6 4' : undefined}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
}

export function SpouseAddButton({ pos1, pos2, familyId, onSpouseClick }: SpouseEdgeProps) {
  if (!familyId || !onSpouseClick) return null
  const y = pos1.y + SYM_CY
  const x1 = pos1.x + NODE_W / 2
  const x2 = pos2.x + NODE_W / 2
  const midX = (x1 + x2) / 2

  return (
    <g
      transform={`translate(${midX}, ${y})`}
      style={{ cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onSpouseClick(familyId) }}
    >
      <circle cx="0" cy="0" r="14" fill="transparent" style={{ pointerEvents: 'all' }} />
      <rect x="-10" y="-10" width="20" height="20" rx="10" fill="var(--bg-primary)" stroke="var(--border-color)" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
      <text x="0" y="4" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="bold" style={{ pointerEvents: 'none' }}>+</text>
    </g>
  )
}

interface PedigreeEdgesProps {
  parentPositions: LayoutPosition[]
  childPositions: LayoutPosition[]
}

export function PedigreeEdges({ parentPositions, childPositions }: PedigreeEdgesProps) {
  if (parentPositions.length === 0 || childPositions.length === 0) return null

  const spouseY = parentPositions[0].y + SYM_CY
  const midX = parentPositions.length === 1
    ? parentPositions[0].x + NODE_W / 2
    : (parentPositions[0].x + parentPositions[1].x + NODE_W) / 2

  const childY = Math.min(...childPositions.map((c) => c.y))
  const siblingBarY = childY - 6
  const childCenters = childPositions.map((c) => c.x + NODE_W / 2)
  const minChildX = Math.min(...childCenters)
  const maxChildX = Math.max(...childCenters)
  const barStart = Math.min(midX, minChildX)
  const barEnd = Math.max(midX, maxChildX)

  return (
    <g>
      <line x1={midX} y1={spouseY} x2={midX} y2={siblingBarY} stroke="#94a3b8" strokeWidth={2} />
      <line x1={barStart} y1={siblingBarY} x2={barEnd} y2={siblingBarY} stroke="#94a3b8" strokeWidth={2} />
      {childPositions.map((c, i) => (
        <line key={i} x1={c.x + NODE_W / 2} y1={siblingBarY} x2={c.x + NODE_W / 2} y2={childY} stroke="#94a3b8" strokeWidth={2} />
      ))}
    </g>
  )
}
