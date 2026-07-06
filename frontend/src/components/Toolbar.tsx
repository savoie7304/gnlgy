interface Props {
  onAddPerson: () => void
  onAddFamily: () => void
  onExport: () => void
  onExportNative: () => void
  onBack: () => void
  treeName: string
}

export default function Toolbar({
  onAddPerson, onAddFamily, onExport, onExportNative, onBack, treeName,
}: Props) {
  return (
    <div className="toolbar">
      <button className="btn btn-sm" onClick={onBack} title="Retour">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
      </button>
      <span className="toolbar-title">{treeName}</span>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className="btn btn-sm" onClick={onAddPerson} title="Ajouter une personne">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          Personne
        </button>
        <button className="btn btn-sm" onClick={onAddFamily} title="Ajouter une famille">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Famille
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button className="btn btn-sm" onClick={onExport} title="Exporter GEDCOM">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          GEDCOM
        </button>
        <button className="btn btn-sm" onClick={onExportNative} title="Exporter .gnlgy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          .gnlgy
        </button>
      </div>
    </div>
  )
}
