export type Gender = 'male' | 'female' | 'other'

export interface Person {
  id: string
  firstName: string
  lastName: string
  gender: Gender
  birthDate?: string
  deathDate?: string
  birthPlace?: string
  deathPlace?: string
  photo?: string
  occupation?: string
  notes?: string
}

export interface Family {
  id: string
  parent1Id?: string
  parent2Id?: string
  childrenIds: string[]
  dashed?: boolean
  marriageDate?: string
  divorceDate?: string
}

export interface FamilyTree {
  id: string
  name: string
  people: Record<string, Person>
  families: Record<string, Family>
  personPositions: Record<string, LayoutPosition>
  createdAt: string
  updatedAt: string
}

export interface LayoutPosition {
  x: number
  y: number
}

export interface LayoutEdge {
  from: string
  to: string
  type: 'spouse' | 'parent-child'
  familyId?: string
  dashed?: boolean
}

export interface TreeLayout {
  positions: Record<string, LayoutPosition>
  edges: LayoutEdge[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  rootId: string
}
