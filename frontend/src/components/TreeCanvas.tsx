import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Person, TreeLayout, LayoutPosition } from '../types'
import { NODE_W, NODE_H } from '../utils/treeLayout'
import PersonNode from './PersonNode'
import { SpouseEdge, SpouseAddButton, PedigreeEdges } from './FamilyEdge'

interface Props {
  layout: TreeLayout | null
  people: Record<string, Person>
  selectedPersonId: string | null
  onPersonClick: (id: string) => void
  onPersonDoubleClick?: (id: string) => void
  onPersonActionMenu: (id: string, x: number, y: number) => void
  onPersonLink?: (sourceId: string, targetId: string) => void
  onPersonMove?: (personId: string, x: number, y: number) => void
  onSpouseClick?: (familyId: string) => void
  onSpouseToggleDash?: (familyId: string) => void
}

export default function TreeCanvas({ layout, people, selectedPersonId, onPersonClick, onPersonDoubleClick, onPersonActionMenu, onPersonLink, onPersonMove, onSpouseClick, onSpouseToggleDash }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 })

  const [dragSource, setDragSource] = useState<string | null>(null)
  const [dragMousePos, setDragMousePos] = useState<{ x: number; y: number } | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  // Local overrides for positions while dragging (real-time move feedback)
  const [localMoves, setLocalMoves] = useState<Record<string, LayoutPosition>>({})
  const fitted = useRef(false)

  useEffect(() => {
    if (!layout || !svgRef.current || fitted.current) return
    fitted.current = true
    const svg = svgRef.current
    const w = svg.clientWidth
    const h = svg.clientHeight
    const bw = layout.bounds.maxX - layout.bounds.minX + 200
    const bh = layout.bounds.maxY - layout.bounds.minY + 200
    if (bw <= 0 || bh <= 0) return

    const scale = Math.min(w / bw, h / bh, 1.5)
    const cx = (layout.bounds.minX + layout.bounds.maxX) / 2
    const cy = (layout.bounds.minY + layout.bounds.maxY) / 2

    setZoom(scale)
    setPan({ x: w / 2 - cx * scale, y: h / 2 - cy * scale })
  }, [layout])

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    }
  }, [pan, zoom])

  const findPersonAt = useCallback((svgX: number, svgY: number): string | null => {
    if (!layout) return null
    for (const [id, pos] of Object.entries(layout.positions)) {
      if (svgX >= pos.x && svgX <= pos.x + NODE_W && svgY >= pos.y && svgY <= pos.y + NODE_H) {
        return id
      }
    }
    return null
  }, [layout])

  const handlePersonMouseDown = useCallback((personId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const svg = screenToSvg(e.clientX, e.clientY)
    dragStartPos.current = { x: svg.x, y: svg.y }
    isDragging.current = false
    setLocalMoves({})
    setDragSource(personId)
    setDragMousePos(svg)
  }, [screenToSvg])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((z) => Math.max(0.1, Math.min(5, z * delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.button === 0 || e.button === 1) && !dragSource) {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setPanOrigin(pan)
    }
  }, [pan, dragSource])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragSource) {
      const svg = screenToSvg(e.clientX, e.clientY)
      setDragMousePos(svg)

      if (dragStartPos.current) {
        const dx = svg.x - dragStartPos.current.x
        const dy = svg.y - dragStartPos.current.y
        if (dx * dx + dy * dy > 100) isDragging.current = true
      }

      if (isDragging.current) {
        const target = findPersonAt(svg.x, svg.y)
        setDragOverTarget(target !== dragSource ? target : null)
        if (!target || target === dragSource) {
          setLocalMoves((prev) => ({
            ...prev,
            [dragSource]: { x: svg.x - NODE_W / 2, y: svg.y - NODE_H / 2 },
          }))
        }
      }
      return
    }
    if (!isPanning) return
    setPan({ x: panOrigin.x + e.clientX - panStart.x, y: panOrigin.y + e.clientY - panStart.y })
  }, [isPanning, panStart, panOrigin, dragSource, screenToSvg, findPersonAt])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragSource && isDragging.current) {
      const svg = screenToSvg(e.clientX, e.clientY)
      const target = findPersonAt(svg.x, svg.y)
      if (target && target !== dragSource && onPersonLink) {
        onPersonLink(dragSource, target)
      } else if (!target && onPersonMove) {
        const moved = localMoves[dragSource]
        if (moved) {
          onPersonMove(dragSource, moved.x, moved.y)
        } else {
          onPersonMove(dragSource, svg.x - NODE_W / 2, svg.y - NODE_H / 2)
        }
      }
      setLocalMoves({})
      setDragSource(null)
      setDragMousePos(null)
      setDragOverTarget(null)
      dragStartPos.current = null
      isDragging.current = false
      return
    }
    if (dragSource) {
      if (dragSource && onPersonClick) onPersonClick(dragSource)
      setDragSource(null)
      setDragMousePos(null)
      setDragOverTarget(null)
      dragStartPos.current = null
      isDragging.current = false
    }
    setIsPanning(false)
  }, [dragSource, screenToSvg, findPersonAt, onPersonLink, onPersonClick, onPersonMove, localMoves])

  // Merge layout positions with local move overrides
  const effectivePos = useMemo(() => {
    if (!layout) return {} as Record<string, LayoutPosition>
    const p = { ...layout.positions }
    for (const [id, pos] of Object.entries(localMoves)) {
      p[id] = pos
    }
    return p
  }, [layout, localMoves])

  // Group parent-child edges by family for pedigree rendering
  const pedigreeGroups = useMemo(() => {
    if (!layout) return []
    const groups = new Map<string, { familyId: string; parentId: string; childIds: string[] }>()
    for (const edge of layout.edges) {
      if (edge.type === 'parent-child' && edge.familyId) {
        if (!groups.has(edge.familyId)) {
          groups.set(edge.familyId, { familyId: edge.familyId, parentId: edge.from, childIds: [] })
        }
        groups.get(edge.familyId)!.childIds.push(edge.to)
      }
    }
    return [...groups.values()].map((g) => ({
      familyId: g.familyId,
      parentId: g.parentId,
      childIds: [...new Set(g.childIds)],
    }))
  }, [layout])

  if (!layout) {
    return (
      <div className="tree-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
          <p>Aucune personne dans l'arbre</p>
          <span>Ajoutez une personne avec le bouton "+" dans la barre d'outils</span>
        </div>
      </div>
    )
  }

  const isMoving = dragSource && isDragging.current && !dragOverTarget

  return (
    <div className="tree-container" style={{ cursor: isPanning ? 'grabbing' : (dragSource ? (isMoving ? 'move' : 'crosshair') : 'grab') }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Spouse edges */}
          {layout.edges
            .filter((e) => e.type === 'spouse')
            .map((edge) => {
              const p1 = effectivePos[edge.from]
              const p2 = effectivePos[edge.to]
              if (!p1 || !p2) return null
              return <SpouseEdge key={`s-${edge.from}-${edge.to}`} pos1={p1} pos2={p2} dashed={edge.dashed} familyId={edge.familyId} onLineClick={onSpouseToggleDash} onSpouseClick={onSpouseClick} />
            })}

          {/* Pedigree parent-child groups */}
          {pedigreeGroups.map((g) => {
            const parentPos = effectivePos[g.parentId]
            if (!parentPos) return null
            const spouseEdge = layout.edges.find(
              (e) => e.type === 'spouse' && e.familyId === g.familyId
            )
            const spouseId = spouseEdge
              ? (spouseEdge.from === g.parentId ? spouseEdge.to : spouseEdge.from)
              : undefined
            const parentPositions = spouseId && effectivePos[spouseId]
              ? [parentPos, effectivePos[spouseId]]
              : [parentPos]
            const childPositions = g.childIds
              .map((id) => effectivePos[id])
              .filter(Boolean) as LayoutPosition[]
            if (childPositions.length === 0) return null
            return (
              <PedigreeEdges
                key={`ped-${g.parentId}`}
                parentPositions={parentPositions}
                childPositions={childPositions}
              />
            )
          })}

          {/* Drag line */}
          {dragSource && dragMousePos && isDragging.current && (
            <>
              <line
                x1={effectivePos[dragSource] ? effectivePos[dragSource].x + NODE_W / 2 : dragMousePos.x}
                y1={effectivePos[dragSource] ? effectivePos[dragSource].y + NODE_H / 2 : dragMousePos.y}
                x2={dragMousePos.x}
                y2={dragMousePos.y}
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeDasharray="6 4"
              />
              <circle cx={dragMousePos.x} cy={dragMousePos.y} r={6} fill="#3b82f6" opacity={0.6} />
            </>
          )}

          {/* Person nodes */}
          {Object.keys(people).map((id) => {
            const person = people[id]
            const p = effectivePos[id]
            if (!person || !p) return null
            return (
              <PersonNode
                key={id}
                person={person}
                pos={p}
                isSelected={id === selectedPersonId}
                isOver={id === dragOverTarget}
                onClick={() => onPersonClick(id)}
                onDoubleClick={onPersonDoubleClick ? () => onPersonDoubleClick(id) : undefined}
                onActionMenu={(e) => onPersonActionMenu(id, e.clientX, e.clientY)}
                onMouseDown={(e) => handlePersonMouseDown(id, e)}
              />
            )
          })}

          {/* + buttons on top of everything */}
          {onSpouseClick && layout.edges
            .filter((e) => e.type === 'spouse' && e.familyId)
            .map((edge) => {
              const p1 = effectivePos[edge.from]
              const p2 = effectivePos[edge.to]
              if (!p1 || !p2) return null
              return <SpouseAddButton key={`btn-${edge.from}-${edge.to}`} pos1={p1} pos2={p2} familyId={edge.familyId!} onSpouseClick={onSpouseClick} />
            })}
        </g>
      </svg>
    </div>
  )
}
