import { create } from 'zustand'
import type { Person, Family, FamilyTree, Gender } from '../types'
import { generateTreeId, generatePersonId, generateFamilyId, createPerson, createFamily } from '../utils/id'
import { api } from '../api'

interface TreeStore {
  trees: FamilyTree[]
  currentTreeId: string | null
  selectedPersonId: string | null
  loaded: boolean

  loadTrees: () => Promise<void>
  setCurrentTree: (id: string | null) => void
  setSelectedPerson: (id: string | null) => void
  getCurrentTree: () => FamilyTree | undefined

  createTree: (name: string) => string
  deleteTree: (id: string) => void
  updateTree: (id: string, updates: Partial<FamilyTree>) => void

  addPerson: (treeId: string, person: Person) => void
  updatePerson: (treeId: string, personId: string, updates: Partial<Person>) => void
  removePerson: (treeId: string, personId: string) => void

  addFamily: (treeId: string, family: Family) => void
  updateFamily: (treeId: string, familyId: string, updates: Partial<Family>) => void
  removeFamily: (treeId: string, familyId: string) => void

  getPerson: (treeId: string, personId: string) => Person | undefined
  getFamily: (treeId: string, familyId: string) => Family | undefined
  getPersonFamilies: (treeId: string, personId: string) => Family[]
  getPersonParentFamily: (treeId: string, personId: string) => Family | undefined
  getPersonChildren: (treeId: string, personId: string) => Person[]
  getPersonSiblings: (treeId: string, personId: string) => Person[]
  getPersonPartners: (treeId: string, personId: string) => Person[]

  addParent: (treeId: string, personId: string, gender: 'male' | 'female') => Person | undefined
  addSpouse: (treeId: string, personId: string) => { person: Person; family: Family } | undefined
  addChild: (treeId: string, personId: string) => Person | undefined
  addSibling: (treeId: string, personId: string) => Person | undefined
  addHalfSibling: (treeId: string, personId: string, sharedParentId: string) => Person | undefined
  addCousin: (treeId: string, personId: string) => Person | undefined

  setPersonPosition: (treeId: string, personId: string, pos: { x: number; y: number }) => void
  clearPersonPosition: (treeId: string, personId: string) => void

  linkAsSpouse: (treeId: string, person1Id: string, person2Id: string) => void
  linkAsParent: (treeId: string, childId: string, parentId: string) => void
  linkAsChild: (treeId: string, parentId: string, childId: string) => void
  linkAsSibling: (treeId: string, person1Id: string, person2Id: string) => void
}

function generateBlankPerson(gender?: Gender): Person {
  return {
    id: generatePersonId(),
    firstName: '',
    lastName: '',
    gender: gender ?? 'other',
  }
}

export const useTreeStore = create<TreeStore>()((set, get) => ({
  trees: [],
  currentTreeId: null,
  selectedPersonId: null,
  loaded: false,

  loadTrees: async () => {
    try {
      const trees = await api.getTrees()
      set({ trees, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  setCurrentTree: (id) => set({ currentTreeId: id }),

  setSelectedPerson: (id) => set({ selectedPersonId: id }),

  getCurrentTree: () => {
    const { trees, currentTreeId } = get()
    return trees.find((t) => t.id === currentTreeId)
  },

  createTree: (name) => {
    const id = generateTreeId()
    const now = new Date().toISOString()
    const tree: FamilyTree = { id, name, people: {}, families: {}, personPositions: {}, createdAt: now, updatedAt: now }
    set((s) => ({ trees: [...s.trees, tree], currentTreeId: id }))
    api.createTree(name).catch(() => {})
    return id
  },

  deleteTree: (id) => {
    set((s) => ({
      trees: s.trees.filter((t) => t.id !== id),
      currentTreeId: s.currentTreeId === id ? (s.trees.length > 1 ? s.trees.find((t) => t.id !== id)?.id ?? null : null) : s.currentTreeId,
    }))
    api.deleteTree(id).catch(() => {})
  },

  updateTree: (id, updates) => {
    set((s) => ({
      trees: s.trees.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
    }))
  },

  addPerson: (treeId, person) => {
    set((s) => ({
      trees: s.trees.map((t) => (t.id === treeId ? { ...t, people: { ...t.people, [person.id]: person }, updatedAt: new Date().toISOString() } : t)),
    }))
    api.addPerson(treeId, person).catch(() => {})
  },

  updatePerson: (treeId, personId, updates) => {
    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        const existing = t.people[personId]
        if (!existing) return t
        return { ...t, people: { ...t.people, [personId]: { ...existing, ...updates } }, updatedAt: new Date().toISOString() }
      }),
    }))
    api.updatePerson(treeId, personId, updates).catch(() => {})
  },

  removePerson: (treeId, personId) => {
    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        const { [personId]: _, ...restPeople } = t.people
        const families: Record<string, Family> = {}
        for (const f of Object.values(t.families)) {
          const updated = { ...f }
          if (updated.parent1Id === personId) delete updated.parent1Id
          if (updated.parent2Id === personId) delete updated.parent2Id
          updated.childrenIds = updated.childrenIds.filter((c) => c !== personId)
          families[updated.id] = updated
        }
        const { [personId]: _pos, ...restPos } = t.personPositions ?? {}
        return { ...t, people: restPeople, families, personPositions: restPos, updatedAt: new Date().toISOString() }
      }),
      selectedPersonId: get().selectedPersonId === personId ? null : get().selectedPersonId,
    }))
    api.removePerson(treeId, personId).catch(() => {})
  },

  addFamily: (treeId, family) => {
    set((s) => ({
      trees: s.trees.map((t) => (t.id === treeId ? { ...t, families: { ...t.families, [family.id]: family }, updatedAt: new Date().toISOString() } : t)),
    }))
    api.addFamily(treeId, family).catch(() => {})
  },

  updateFamily: (treeId, familyId, updates) => {
    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        const existing = t.families[familyId]
        if (!existing) return t
        return { ...t, families: { ...t.families, [familyId]: { ...existing, ...updates } }, updatedAt: new Date().toISOString() }
      }),
    }))
    api.updateFamily(treeId, familyId, updates).catch(() => {})
  },

  removeFamily: (treeId, familyId) => {
    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        const { [familyId]: _, ...restFamilies } = t.families
        return { ...t, families: restFamilies, updatedAt: new Date().toISOString() }
      }),
    }))
    api.removeFamily(treeId, familyId).catch(() => {})
  },

  getPerson: (treeId, personId) => get().trees.find((t) => t.id === treeId)?.people[personId],
  getFamily: (treeId, familyId) => get().trees.find((t) => t.id === treeId)?.families[familyId],

  getPersonFamilies: (treeId, personId) =>
    Object.values(get().trees.find((t) => t.id === treeId)?.families ?? {}).filter((f) => f.parent1Id === personId || f.parent2Id === personId),

  getPersonParentFamily: (treeId, personId) =>
    Object.values(get().trees.find((t) => t.id === treeId)?.families ?? {}).find((f) => f.childrenIds.includes(personId)),

  getPersonChildren: (treeId, personId) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return []
    const childIds = new Set<string>()
    for (const f of Object.values(tree.families)) {
      if (f.parent1Id === personId || f.parent2Id === personId) {
        for (const cid of f.childrenIds) childIds.add(cid)
      }
    }
    return [...childIds].map((cid) => tree.people[cid]).filter(Boolean)
  },

  getPersonSiblings: (treeId, personId) => {
    const parentFamily = get().getPersonParentFamily(treeId, personId)
    if (!parentFamily) return []
    return parentFamily.childrenIds.filter((id) => id !== personId).map((id) => get().trees.find((t) => t.id === treeId)?.people[id]).filter(Boolean) as Person[]
  },

  getPersonPartners: (treeId, personId) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return []
    const partnerIds = Object.values(tree.families)
      .filter((f) => f.parent1Id === personId || f.parent2Id === personId)
      .map((f) => (f.parent1Id === personId ? f.parent2Id : f.parent1Id))
      .filter(Boolean) as string[]
    return [...new Set(partnerIds)].map((id) => tree.people[id]).filter(Boolean)
  },

  // === Smart actions ===

  addParent: (treeId, personId, gender) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return undefined

    let parentFamily = Object.values(tree.families).find((f) => f.childrenIds.includes(personId))
    if (parentFamily) {
      const existingParent = gender === 'male' ? parentFamily.parent1Id : parentFamily.parent2Id
      if (existingParent) return undefined
    }

    const parent = generateBlankPerson(gender)
    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        let families = { ...t.families }
        if (parentFamily) {
          families = { ...families, [parentFamily.id]: { ...parentFamily, [gender === 'male' ? 'parent1Id' : 'parent2Id']: parent.id } }
        } else {
          const newFamily = createFamily(gender === 'male' ? parent.id : undefined, gender === 'female' ? parent.id : undefined, [personId])
          families = { ...families, [newFamily.id]: newFamily }
        }
        return { ...t, people: { ...t.people, [parent.id]: parent }, families, updatedAt: new Date().toISOString() }
      }),
    }))
    api.addParent(treeId, personId, gender).catch(() => {})
    return parent
  },

  addSpouse: (treeId, personId) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return undefined

    const spouse = generateBlankPerson()
    const family = createFamily(personId, spouse.id)
    set((s) => ({
      trees: s.trees.map((t) =>
        t.id === treeId ? { ...t, people: { ...t.people, [spouse.id]: spouse }, families: { ...t.families, [family.id]: family }, updatedAt: new Date().toISOString() } : t
      ),
    }))
    api.addSpouse(treeId, personId).catch(() => {})
    return { person: spouse, family }
  },

  addChild: (treeId, personId) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return undefined

    const child = generateBlankPerson()
    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        const families = Object.values(t.families)
        let fam = families.find((f) => f.parent1Id === personId || f.parent2Id === personId)
        let updatedFamilies = { ...t.families }
        if (fam) {
          updatedFamilies = { ...updatedFamilies, [fam.id]: { ...fam, childrenIds: [...fam.childrenIds, child.id] } }
        } else {
          const newFamily: Family = { id: generateFamilyId(), parent1Id: personId, childrenIds: [child.id] }
          updatedFamilies = { ...updatedFamilies, [newFamily.id]: newFamily }
        }
        return { ...t, people: { ...t.people, [child.id]: child }, families: updatedFamilies, updatedAt: new Date().toISOString() }
      }),
    }))
    api.addChild(treeId, personId).catch(() => {})
    return child
  },

  addSibling: (treeId, personId) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return undefined

    const sibling = generateBlankPerson()
    let parentFamily = Object.values(tree.families).find((f) => f.childrenIds.includes(personId))

    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        if (parentFamily) {
          return { ...t, people: { ...t.people, [sibling.id]: sibling }, families: { ...t.families, [parentFamily!.id]: { ...parentFamily!, childrenIds: [...parentFamily!.childrenIds, sibling.id] } }, updatedAt: new Date().toISOString() }
        }
        const father = generateBlankPerson('male')
        const mother = generateBlankPerson('female')
        const newFamily = createFamily(father.id, mother.id, [personId, sibling.id])
        return { ...t, people: { ...t.people, [father.id]: father, [mother.id]: mother, [sibling.id]: sibling }, families: { ...t.families, [newFamily.id]: newFamily }, updatedAt: new Date().toISOString() }
      }),
    }))
    api.addSibling(treeId, personId).catch(() => {})
    return sibling
  },

  addHalfSibling: (treeId, personId, sharedParentId) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return undefined

    const sibling = generateBlankPerson()
    const newFamily = createFamily(sharedParentId, undefined, [sibling.id])
    set((s) => ({
      trees: s.trees.map((t) =>
        t.id === treeId ? { ...t, people: { ...t.people, [sibling.id]: sibling }, families: { ...t.families, [newFamily.id]: newFamily }, updatedAt: new Date().toISOString() } : t
      ),
    }))
    api.addHalfSibling(treeId, personId, sharedParentId).catch(() => {})
    return sibling
  },

  addCousin: (treeId, personId) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return undefined

    let parentFamily = Object.values(tree.families).find((f) => f.childrenIds.includes(personId))
    if (!parentFamily) {
      const father = generateBlankPerson('male')
      const mother = generateBlankPerson('female')
      parentFamily = createFamily(father.id, mother.id, [personId])
      set((s) => ({
        trees: s.trees.map((t) =>
          t.id === treeId ? { ...t, people: { ...t.people, [father.id]: father, [mother.id]: mother }, families: { ...t.families, [parentFamily!.id]: parentFamily! }, updatedAt: new Date().toISOString() } : t
        ),
      }))
    }

    const parentId = parentFamily.parent1Id ?? parentFamily.parent2Id
    if (!parentId) return undefined

    const updatedState = get()
    const currentTree = updatedState.trees.find((t) => t.id === treeId)!
    let grandparentFamily = Object.values(currentTree.families).find((f) => f.childrenIds.includes(parentId))

    if (!grandparentFamily) {
      const gf = generateBlankPerson('male')
      const gm = generateBlankPerson('female')
      grandparentFamily = createFamily(gf.id, gm.id, [parentId])
      set((s) => ({
        trees: s.trees.map((t) =>
          t.id === treeId ? { ...t, people: { ...t.people, [gf.id]: gf, [gm.id]: gm }, families: { ...t.families, [grandparentFamily!.id]: grandparentFamily! }, updatedAt: new Date().toISOString() } : t
        ),
      }))
    }

    const uncle = generateBlankPerson()
    const aunt = generateBlankPerson()
    const cousin = generateBlankPerson()
    const uncleFamily = createFamily(uncle.id, aunt.id, [cousin.id])

    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        return {
          ...t,
          people: { ...t.people, [uncle.id]: uncle, [aunt.id]: aunt, [cousin.id]: cousin },
          families: {
            ...t.families,
            [grandparentFamily!.id]: { ...grandparentFamily!, childrenIds: [...grandparentFamily!.childrenIds, uncle.id] },
            [uncleFamily.id]: uncleFamily,
          },
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
    api.addCousin(treeId, personId).catch(() => {})
    return cousin
  },

  // === Positions ===

  setPersonPosition: (treeId, personId, pos) => {
    set((s) => ({
      trees: s.trees.map((t) => (t.id === treeId ? { ...t, personPositions: { ...t.personPositions, [personId]: pos } } : t)),
    }))
    api.setPosition(treeId, personId, pos.x, pos.y).catch(() => {})
  },

  clearPersonPosition: (treeId, personId) => {
    set((s) => ({
      trees: s.trees.map((t) => {
        if (t.id !== treeId) return t
        const { [personId]: _, ...rest } = t.personPositions ?? {}
        return { ...t, personPositions: rest }
      }),
    }))
    api.clearPosition(treeId, personId).catch(() => {})
  },

  // === Link existing people ===

  linkAsSpouse: (treeId, person1Id, person2Id) => {
    const family = createFamily(person1Id, person2Id)
    set((s) => ({
      trees: s.trees.map((t) => (t.id === treeId ? { ...t, families: { ...t.families, [family.id]: family }, updatedAt: new Date().toISOString() } : t)),
    }))
    api.link(treeId, 'spouse', person1Id, person2Id).catch(() => {})
  },

  linkAsParent: (treeId, childId, parentId) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return
    const parentFamily = Object.values(tree.families).find((f) => f.childrenIds.includes(childId))
    if (parentFamily) {
      const parent = tree.people[parentId]
      const key = parent?.gender === 'male' ? 'parent1Id' : parent?.gender === 'female' ? 'parent2Id' : 'parent1Id'
      if (parentFamily[key]) return
      set((s) => ({
        trees: s.trees.map((t) =>
          t.id === treeId ? { ...t, families: { ...t.families, [parentFamily.id]: { ...parentFamily, [key]: parentId } }, updatedAt: new Date().toISOString() } : t
        ),
      }))
    } else {
      const family = createFamily(parentId, undefined, [childId])
      set((s) => ({
        trees: s.trees.map((t) =>
          t.id === treeId ? { ...t, families: { ...t.families, [family.id]: family }, updatedAt: new Date().toISOString() } : t
        ),
      }))
    }
    api.link(treeId, 'parent', childId, parentId).catch(() => {})
  },

  linkAsChild: (treeId, parentId, childId) => {
    get().linkAsParent(treeId, childId, parentId)
  },

  linkAsSibling: (treeId, person1Id, person2Id) => {
    const tree = get().trees.find((t) => t.id === treeId)
    if (!tree) return
    let parentFamily = Object.values(tree.families).find((f) => f.childrenIds.includes(person1Id))
    if (parentFamily) {
      if (parentFamily.childrenIds.includes(person2Id)) return
      set((s) => ({
        trees: s.trees.map((t) =>
          t.id === treeId ? { ...t, families: { ...t.families, [parentFamily!.id]: { ...parentFamily!, childrenIds: [...parentFamily!.childrenIds, person2Id] } }, updatedAt: new Date().toISOString() } : t
        ),
      }))
    } else {
      const father = generateBlankPerson('male')
      const mother = generateBlankPerson('female')
      const family = createFamily(father.id, mother.id, [person1Id, person2Id])
      set((s) => ({
        trees: s.trees.map((t) =>
          t.id === treeId ? { ...t, people: { ...t.people, [father.id]: father, [mother.id]: mother }, families: { ...t.families, [family.id]: family }, updatedAt: new Date().toISOString() } : t
        ),
      }))
    }
    api.link(treeId, 'sibling', person1Id, person2Id).catch(() => {})
  },
}))


