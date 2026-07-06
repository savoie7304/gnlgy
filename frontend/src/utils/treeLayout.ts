import type { FamilyTree, TreeLayout, LayoutPosition, LayoutEdge } from '../types'

export const NODE_W = 180
export const NODE_H = 90
const H_GAP = 30
const V_GAP = 100
const SPOUSE_GAP = 16
const PADDING = 60

function collectAll(tree: FamilyTree, rootId: string): { ids: Set<string>; gen: Map<string, number> } {
  const ids = new Set<string>()
  const gen = new Map<string, number>()
  const queue: { id: string; g: number }[] = [{ id: rootId, g: 0 }]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { id, g } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    ids.add(id)
    gen.set(id, g)

    // ancestors (upward)
    const parentFamily = Object.values(tree.families).find((f) => f.childrenIds.includes(id))
    if (parentFamily) {
      if (parentFamily.parent1Id && !visited.has(parentFamily.parent1Id))
        queue.push({ id: parentFamily.parent1Id, g: g - 1 })
      if (parentFamily.parent2Id && !visited.has(parentFamily.parent2Id))
        queue.push({ id: parentFamily.parent2Id, g: g - 1 })
    }

    // spouse & descendants (sideways + downward)
    for (const f of Object.values(tree.families)) {
      if (f.parent1Id === id || f.parent2Id === id) {
        const spouse = f.parent1Id === id ? f.parent2Id : f.parent1Id
        if (spouse && !visited.has(spouse)) queue.push({ id: spouse, g })
        for (const cid of f.childrenIds) {
          if (!visited.has(cid)) queue.push({ id: cid, g: g + 1 })
        }
      }
    }
  }

  // Add disconnected people at generation maxGen + 1
  let maxGen = 0
  for (const [, g] of gen) maxGen = Math.max(maxGen, g)
  for (const pid of Object.keys(tree.people)) {
    if (!ids.has(pid)) {
      ids.add(pid)
      gen.set(pid, maxGen + 1)
    }
  }

  return { ids, gen }
}

export function computeLayout(tree: FamilyTree, rootId: string): TreeLayout | null {
  if (!tree.people[rootId]) return null

  const { ids, gen } = collectAll(tree, rootId)
  if (ids.size === 0) return null

  // Group by generation
  const genGroups = new Map<number, string[]>()
  for (const id of ids) {
    const g = gen.get(id)!
    if (!genGroups.has(g)) genGroups.set(g, [])
    genGroups.get(g)!.push(id)
  }

  const sortedGens = [...genGroups.keys()].sort((a, b) => a - b)
  const minGen = sortedGens[0]

  // Phase 1: assign columns
  const column = new Map<string, number>()
  const totalCols = new Map<number, number>()

  for (const g of sortedGens) {
    const personIds = genGroups.get(g)!
    const used = new Set<string>()
    const units: string[][] = []

    for (const pid of personIds) {
      if (used.has(pid)) continue
      let spouse: string | undefined

      for (const f of Object.values(tree.families)) {
        if (f.parent1Id === pid || f.parent2Id === pid) {
          const s = f.parent1Id === pid ? f.parent2Id : f.parent1Id
          if (s && personIds.includes(s) && !used.has(s)) { spouse = s; break }
        }
      }

      if (spouse) { units.push([pid, spouse]); used.add(pid); used.add(spouse) }
      else { units.push([pid]); used.add(pid) }
    }

    // Bring secondary spouses closer to their shared person
    for (const f of Object.values(tree.families)) {
      const p1 = f.parent1Id
      const p2 = f.parent2Id
      if (!p1 || !p2) continue
      if (gen.get(p1) !== g || gen.get(p2) !== g) continue
      const inSame = units.some((u) => u.includes(p1) && u.includes(p2))
      if (inSame) continue
      const idx1 = units.findIndex((u) => u.includes(p1))
      const idx2 = units.findIndex((u) => u.includes(p2))
      if (idx1 === -1 || idx2 === -1) continue
      const [far, near] = idx1 > idx2 ? [idx1, idx2] : [idx2, idx1]
      const [unit] = units.splice(far, 1)
      units.splice(near, 0, unit)
    }

    let col = 0
    for (const unit of units) {
      column.set(unit[0], col)
      if (unit[1]) column.set(unit[1], col + 1)
      col += unit.length > 1 ? 2 : 1
    }
    totalCols.set(g, col)
  }

  // Phase 2: position
  const positions: Record<string, LayoutPosition> = {}
  const edges: LayoutEdge[] = []

  for (const g of sortedGens) {
    const row = g - minGen
    const y = PADDING + row * (NODE_H + V_GAP)
    const personIds = genGroups.get(g)!

    for (const pid of personIds) {
      const c = column.get(pid) ?? 0
      const x = PADDING + c * (NODE_W + SPOUSE_GAP)
      positions[pid] = { x, y }
    }

    // Spouse edges (including multiple spouses)
    const hasSpouseEdge = new Set<string>()
    const visitedFamilies = new Set<string>()
    for (const pid of personIds) {
      for (const f of Object.values(tree.families)) {
        if (visitedFamilies.has(f.id)) continue
        if (f.parent1Id === pid || f.parent2Id === pid) {
          const s = f.parent1Id === pid ? f.parent2Id : f.parent1Id
          if (!s || gen.get(s) !== g) continue
          const autoDash = hasSpouseEdge.has(pid) || hasSpouseEdge.has(s)
          const dashed = f.dashed ?? autoDash
          edges.push({ from: pid, to: s, type: 'spouse', familyId: f.id, dashed })
          hasSpouseEdge.add(pid); hasSpouseEdge.add(s)
          visitedFamilies.add(f.id)
        }
      }
    }
  }

  // Phase 3: center children under parents
  const childDx = new Map<string, number>()

  const hasSpouseInSameGen = (personId: string): boolean => {
    const g = gen.get(personId)
    if (g === undefined) return false
    for (const f of Object.values(tree.families)) {
      const spouse = f.parent1Id === personId ? f.parent2Id : f.parent1Id
      if (spouse && gen.get(spouse) === g) return true
    }
    return false
  }

  for (const g of sortedGens) {
    for (const pid of genGroups.get(g)!) {
      for (const f of Object.values(tree.families)) {
        if (f.parent1Id !== pid && f.parent2Id !== pid) continue
        const spouse = f.parent1Id === pid ? f.parent2Id : f.parent1Id
        for (const cid of f.childrenIds) {
          if (!positions[cid] || childDx.has(cid)) continue
          // Don't center if child has a spouse in their own generation
          if (hasSpouseInSameGen(cid)) continue
          const p1 = positions[pid]
          const p2 = spouse && positions[spouse] ? positions[spouse] : null
          const parentCenter = p2 ? (p1.x + p2.x + NODE_W) / 2 : p1.x + NODE_W / 2
          childDx.set(cid, parentCenter - NODE_W / 2 - positions[cid].x)
        }
      }
    }
  }

  for (const [cid, dx] of childDx) {
    if (positions[cid]) positions[cid] = { x: positions[cid].x + dx, y: positions[cid].y }
  }

  // Phase 3b: shift parents (single or couple) above their children
  const parentDx = new Map<string, number>()
  for (const f of Object.values(tree.families)) {
    const parentIds = [f.parent1Id, f.parent2Id].filter(Boolean) as string[]
    if (parentIds.length === 0) continue
    const valid = parentIds.filter((pid) => positions[pid])
    if (valid.length === 0) continue
    // For single parents, don't break spouse pairing from another family
    if (valid.length === 1 && hasSpouseInSameGen(valid[0])) continue
    const parentGen = gen.get(valid[0])!
    const childGen = parentGen + 1
    const below = f.childrenIds.filter((cid) => positions[cid] && gen.get(cid) === childGen)
    if (below.length === 0) continue
    const childAvg = below.reduce((s, cid) => s + positions[cid].x + NODE_W / 2, 0) / below.length
    const parentMid = valid.reduce((s, pid) => s + positions[pid].x + NODE_W / 2, 0) / valid.length
    const dx = childAvg - parentMid
    if (Math.abs(dx) <= 5) continue
    for (const pid of valid) parentDx.set(pid, dx)
  }
  for (const [pid, dx] of parentDx) {
    if (positions[pid]) positions[pid] = { x: positions[pid].x + dx, y: positions[pid].y }
  }

  // Resolve overlaps
  for (const g of sortedGens) {
    const ids = genGroups.get(g)!
      .filter((id) => positions[id])
      .sort((a, b) => positions[a].x - positions[b].x)

    for (let i = 1; i < ids.length; i++) {
      const prev = positions[ids[i - 1]]
      const curr = positions[ids[i]]
      const overlap = prev.x + NODE_W + H_GAP - curr.x
      if (overlap > 0) {
        for (let j = i; j < ids.length; j++) {
          positions[ids[j]] = { x: positions[ids[j]].x + overlap, y: positions[ids[j]].y }
        }
      }
    }
  }

  // Phase 4: parent-child edges (pedigree style)
  for (const f of Object.values(tree.families)) {
    const parentIds = [f.parent1Id, f.parent2Id].filter(Boolean) as string[]
    const childIds = f.childrenIds.filter((cid) => positions[cid])

    if (parentIds.length === 0 || childIds.length === 0) continue

    // Find the generation just below the parents
    const parentGen = parentIds[0] ? gen.get(parentIds[0]) : undefined
    if (parentGen === undefined) continue
    const childGen = parentGen + 1

    // Check if children are in that generation
    const childrenInGen = childIds.filter((cid) => gen.get(cid) === childGen)
    if (childrenInGen.length === 0) continue

    // Connect first parent to each child (for rendering — just individual edges)
    for (const cid of childrenInGen) {
      edges.push({ from: parentIds[0], to: cid, type: 'parent-child', familyId: f.id })
    }
  }

  // Apply stored manual positions as overrides
  if (tree.personPositions) {
    for (const [pid, p] of Object.entries(tree.personPositions)) {
      if (positions[pid]) positions[pid] = { x: p.x, y: p.y }
    }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const pos of Object.values(positions)) {
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + NODE_W)
    maxY = Math.max(maxY, pos.y + NODE_H)
  }

  if (minX === Infinity) {
    return { positions: {}, edges: [], bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600 }, rootId }
  }

  return { positions, edges, bounds: { minX, minY, maxX, maxY }, rootId }
}
