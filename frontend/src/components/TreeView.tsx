import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTreeStore } from '../store/useTreeStore'
import { computeLayout } from '../utils/treeLayout'
import { downloadGedcom } from '../utils/gedcomExporter'
import { generatePersonId, generateFamilyId, createPerson } from '../utils/id'
import { useTheme } from '../hooks/useTheme'

import Toolbar from './Toolbar'
import TreeCanvas from './TreeCanvas'
import ActionMenu from './ActionMenu'
import PersonForm from './PersonForm'
import FamilyForm from './FamilyForm'
import ConfirmDialog from './ConfirmDialog'
import LinkDialog from './LinkDialog'

export default function TreeView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const store = useTreeStore()
  const { toggle: toggleTheme } = useTheme()

  const tree = store.trees.find((t) => t.id === id)
  const selectedPersonId = store.selectedPersonId

  useEffect(() => { store.loadTrees() }, [])

  const [rootId, setRootId] = useState<string | null>(null)

  const [menuPersonId, setMenuPersonId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })

  const [personFormOpen, setPersonFormOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<string | null>(null)

  const [familyFormOpen, setFamilyFormOpen] = useState(false)
  const [editingFamily, setEditingFamily] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [linkSource, setLinkSource] = useState<string | null>(null)
  const [linkTarget, setLinkTarget] = useState<string | null>(null)

  useEffect(() => {
    if (id) store.setCurrentTree(id)
  }, [id])

  useEffect(() => {
    if (tree && !rootId && Object.keys(tree.people).length > 0) {
      setRootId(Object.keys(tree.people)[0])
    }
  }, [tree, rootId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPersonId && tree) {
        if (personFormOpen || familyFormOpen || menuPersonId) return
        e.preventDefault()
        setConfirmDelete(selectedPersonId)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [selectedPersonId, tree, personFormOpen, familyFormOpen, menuPersonId])

  const layout = useMemo(() => {
    if (!tree || !rootId) return null
    try { return computeLayout(tree, rootId) }
    catch { return null }
  }, [tree, rootId])

  const handlePersonClick = useCallback((personId: string) => {
    store.setSelectedPerson(personId)
  }, [store])

  const handlePersonDoubleClick = useCallback((personId: string) => {
    setEditingPerson(personId)
    setPersonFormOpen(true)
  }, [])

  const closeMenu = useCallback(() => setMenuPersonId(null), [])

  const handlePersonActionMenu = useCallback((personId: string, x: number, y: number) => {
    setMenuPersonId(personId)
    setMenuPos({ x, y })
  }, [])

  const handleMenuAction = useCallback((action: string) => {
    if (!tree || !menuPersonId) return
    const person = tree.people[menuPersonId]
    if (!person) return

    switch (action) {
      case 'add-both-parents':
        store.addParent(tree.id, menuPersonId, 'male')
        store.addParent(tree.id, menuPersonId, 'female')
        break
      case 'add-father':
        store.addParent(tree.id, menuPersonId, 'male')
        break
      case 'add-mother':
        store.addParent(tree.id, menuPersonId, 'female')
        break
      case 'add-spouse':
        store.addSpouse(tree.id, menuPersonId)
        break
      case 'add-child':
        store.addChild(tree.id, menuPersonId)
        break
      case 'add-sibling':
        store.addSibling(tree.id, menuPersonId)
        break
      case 'add-half-sibling': {
        const families = store.getPersonFamilies(tree.id, menuPersonId)
        const pf = families.find((f) => f.childrenIds.includes(menuPersonId))
        const sp = pf?.parent1Id || pf?.parent2Id
        if (sp) store.addHalfSibling(tree.id, menuPersonId, sp)
        break
      }
      case 'add-cousin':
        store.addCousin(tree.id, menuPersonId)
        break
      case 'edit': { setEditingPerson(menuPersonId); setPersonFormOpen(true); break }
      case 'delete': { setConfirmDelete(menuPersonId); break }
      default: {
        if (action.startsWith('add-half-sibling:')) {
          const parentId = action.split(':')[1]
          if (parentId) store.addHalfSibling(tree.id, menuPersonId, parentId)
        }
        break
      }
    }
    closeMenu()
  }, [tree, menuPersonId, store, closeMenu])

  const handlePersonSave = useCallback((data: Record<string, any>) => {
    if (!tree || !editingPerson) return
    store.updatePerson(tree.id, editingPerson, data)
    setPersonFormOpen(false)
    setEditingPerson(null)
  }, [tree, editingPerson, store])

  const handlePersonDelete = useCallback(() => {
    if (!tree || !editingPerson) return
    store.removePerson(tree.id, editingPerson)
    setPersonFormOpen(false)
    setEditingPerson(null)
    if (rootId === editingPerson) setRootId(null)
  }, [tree, editingPerson, store, rootId])

  const handlePersonMove = useCallback((personId: string, x: number, y: number) => {
    if (!tree) return
    store.setPersonPosition(tree.id, personId, { x, y })
  }, [tree, store])

  const handlePersonLink = useCallback((sourceId: string, targetId: string) => {
    setLinkSource(sourceId)
    setLinkTarget(targetId)
  }, [])

  const handleLinkAction = useCallback((type: 'spouse' | 'parent' | 'child' | 'sibling') => {
    if (!tree || !linkSource || !linkTarget) return
    switch (type) {
      case 'spouse':
        store.linkAsSpouse(tree.id, linkSource, linkTarget)
        break
      case 'parent':
        store.linkAsParent(tree.id, linkTarget, linkSource)
        break
      case 'child':
        store.linkAsParent(tree.id, linkSource, linkTarget)
        break
      case 'sibling':
        store.linkAsSibling(tree.id, linkSource, linkTarget)
        break
    }
    setLinkSource(null)
    setLinkTarget(null)
  }, [tree, linkSource, linkTarget, store])

  const handleFamilySave = useCallback((data: { parent1Id?: string; parent2Id?: string; childrenIds: string[]; marriageDate?: string; divorceDate?: string }) => {
    if (!tree) return
    if (editingFamily) {
      store.updateFamily(tree.id, editingFamily, data)
    } else {
      store.addFamily(tree.id, { id: generateFamilyId(), ...data })
    }
    setFamilyFormOpen(false)
    setEditingFamily(null)
  }, [tree, editingFamily, store])

  const handleFamilyDelete = useCallback(() => {
    if (!tree || !editingFamily) return
    store.removeFamily(tree.id, editingFamily)
    setFamilyFormOpen(false)
    setEditingFamily(null)
  }, [tree, editingFamily, store])

  const handleExport = useCallback(() => {
    if (!tree) return
    downloadGedcom(tree)
  }, [tree])

  const handleAddPerson = useCallback(() => {
    if (!tree) return
    const np = { id: generatePersonId(), firstName: '', lastName: '', gender: 'other' as const }
    store.addPerson(tree.id, np)
    if (!rootId) setRootId(np.id)
    setEditingPerson(np.id)
    setPersonFormOpen(true)
  }, [tree, rootId, store])

  const handleSpouseToggleDash = useCallback((familyId: string) => {
    if (!tree) return
    const family = tree.families[familyId]
    if (family) {
      store.updateFamily(tree.id, familyId, { dashed: !family.dashed })
    }
  }, [tree, store])

  const handleSpouseClick = useCallback((familyId: string) => {
    if (!tree) return
    const child = createPerson()
    store.addPerson(tree.id, child)
    const family = tree.families[familyId]
    if (family) {
      store.updateFamily(tree.id, familyId, { childrenIds: [...family.childrenIds, child.id] })
    }
    setEditingPerson(child.id)
    setPersonFormOpen(true)
  }, [tree, store])

  const handleAddFamily = useCallback(() => {
    setEditingFamily(null)
    setFamilyFormOpen(true)
  }, [])

  if (!store.loaded) {
    return (
      <div className="empty-state" style={{ minHeight: '100vh' }}>
        <p>Chargement...</p>
      </div>
    )
  }

  if (!tree) {
    return (
      <div className="empty-state" style={{ minHeight: '100vh' }}>
        <p>Arbre introuvable</p>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>Retour</button>
      </div>
    )
  }

  const editPerson = editingPerson ? tree.people[editingPerson] : null
  const editFamily = editingFamily ? tree.families[editingFamily] : null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <Toolbar
          onAddPerson={handleAddPerson}
          onAddFamily={handleAddFamily}
          onExport={handleExport}
          onBack={() => navigate('/')}
          treeName={tree.name}
        />
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Basculer le thème" style={{ width: 36, height: 36 }}>
          <svg className="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg className="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
      </div>

      <TreeCanvas
        layout={layout}
        people={tree.people}
        selectedPersonId={selectedPersonId}
        onPersonClick={handlePersonClick}
        onPersonDoubleClick={handlePersonDoubleClick}
        onPersonActionMenu={handlePersonActionMenu}
        onPersonLink={handlePersonLink}
        onPersonMove={handlePersonMove}
        onSpouseClick={handleSpouseClick}
        onSpouseToggleDash={handleSpouseToggleDash}
      />

      <ActionMenu
        open={menuPersonId !== null}
        x={menuPos.x}
        y={menuPos.y}
        onClose={closeMenu}
        onAction={handleMenuAction}
        hasParent={false}
        hasPartner={false}
        hasChildren={false}
        hasSiblings={false}
        parents={menuPersonId && tree ? (() => {
          const pf = Object.values(tree.families).find((f) => f.childrenIds.includes(menuPersonId))
          if (!pf) return undefined
          const list: { id: string; label: string }[] = []
          if (pf.parent1Id && tree.people[pf.parent1Id]) {
            const p = tree.people[pf.parent1Id]
            list.push({ id: pf.parent1Id, label: `Père : ${p.firstName} ${p.lastName}`.trim() })
          }
          if (pf.parent2Id && tree.people[pf.parent2Id]) {
            const p = tree.people[pf.parent2Id]
            list.push({ id: pf.parent2Id, label: `Mère : ${p.firstName} ${p.lastName}`.trim() })
          }
          return list.length > 0 ? list : undefined
        })() : undefined}
      />

      <PersonForm
        open={personFormOpen}
        person={editPerson ?? { id: '', firstName: '', lastName: '', gender: 'other' }}
        onSave={handlePersonSave}
        onDelete={editingPerson ? handlePersonDelete : undefined}
        onClose={() => { setPersonFormOpen(false); setEditingPerson(null) }}
      />

      <FamilyForm
        open={familyFormOpen}
        treeId={tree.id}
        people={tree.people}
        family={editFamily}
        onSave={handleFamilySave}
        onDelete={editingFamily ? handleFamilyDelete : undefined}
        onClose={() => { setFamilyFormOpen(false); setEditingFamily(null) }}
      />

      <LinkDialog
        open={linkSource !== null && linkTarget !== null}
        source={linkSource && tree ? tree.people[linkSource] : null}
        target={linkTarget && tree ? tree.people[linkTarget] : null}
        onLink={handleLinkAction}
        onClose={() => { setLinkSource(null); setLinkTarget(null) }}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer cette personne ?"
        message="Cette action est irréversible. Les familles liées seront mises à jour."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirmDelete && tree) {
            store.removePerson(tree.id, confirmDelete)
            if (rootId === confirmDelete) setRootId(null)
          }
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
