import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTreeStore } from '../store/useTreeStore'
import { api } from '../api'
import { useTheme } from '../hooks/useTheme'
import ConfirmDialog from './ConfirmDialog'

export default function Dashboard() {
  const navigate = useNavigate()
  const { trees, loaded, loadTrees, createTree, deleteTree, setCurrentTree } = useTreeStore()

  useEffect(() => { loadTrees() }, [])
  const { isDark, toggle: toggleTheme } = useTheme()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = () => {
    const name = newName.trim() || `Arbre ${trees.length + 1}`
    const id = createTree(name)
    setNewName('')
    setShowNew(false)
    setCurrentTree(id)
    navigate(`/tree/${id}`)
  }

  const handleImport = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const tree = await api.importGedcom(file)
      await useTreeStore.getState().loadTrees()
      useTreeStore.getState().setCurrentTree(tree.id)
      navigate(`/tree/${tree.id}`)
    } catch {
      alert("Erreur lors de l'import du fichier GEDCOM.")
    }
    e.target.value = ''
  }

  const personCount = (treeId: string) => {
    const tree = trees.find((t) => t.id === treeId)
    return tree ? Object.keys(tree.people).length : 0
  }

  return (
    <div>
      <header className="header">
        <h1>Généalogie</h1>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Basculer le thème">
          <svg className="moon-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg className="sun-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
      </header>

      {!loaded ? (
        <div className="empty-state" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <p>Chargement...</p>
        </div>
      ) : (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 24 }}>
          <button className="btn" onClick={handleImport}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Importer GEDCOM
          </button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvel arbre
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept=".ged,.GED" onChange={handleFileChange} style={{ display: 'none' }} />

        {showNew && (
          <div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom de l'arbre..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Créer</button>
            <button className="btn btn-sm" onClick={() => { setShowNew(false); setNewName('') }}>Annuler</button>
          </div>
        )}

        {trees.length === 0 && !showNew && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4"/></svg>
            <p>Aucun arbre généalogique</p>
            <span>Créez un nouvel arbre ou importez un fichier GEDCOM</span>
          </div>
        )}

        <div className="dashboard-grid">
          {trees.map((tree) => (
            <div key={tree.id} className="card-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{tree.name}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {personCount(tree.id)} personne{personCount(tree.id) !== 1 ? 's' : ''}
                  {' · '}Créé le {new Date(tree.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => { setCurrentTree(tree.id); navigate(`/tree/${tree.id}`) }}>Ouvrir</button>
                <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(tree.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
      <ConfirmDialog
        open={deleteId !== null}
        title="Supprimer l'arbre ?"
        message="Cette action est irréversible. Toutes les données seront perdues."
        confirmLabel="Supprimer"
        onConfirm={() => { if (deleteId) deleteTree(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
