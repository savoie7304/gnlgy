const BASE = '/api'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) throw new Error(`API error ${res.status} ${res.statusText}`)
  const text = await res.text()
  return text ? JSON.parse(text) : undefined
}

export const api = {
  // Trees
  getTrees: () => request<any[]>('GET', '/trees'),
  createTree: (name: string) => request<any>('POST', '/trees', { name }),
  deleteTree: (id: string) => request<void>('DELETE', `/trees/${id}`),
  getTree: (id: string) => request<any>('GET', `/trees/${id}`),

  // Layout
  getLayout: (treeId: string, root?: string) =>
    request<any>('GET', `/trees/${treeId}/layout${root ? `?root=${root}` : ''}`),

  // People
  addPerson: (treeId: string, person: any) =>
    request<any>('POST', `/trees/${treeId}/people`, person),
  updatePerson: (treeId: string, personId: string, updates: any) =>
    request<any>('PUT', `/trees/${treeId}/people/${personId}`, updates),
  removePerson: (treeId: string, personId: string) =>
    request<void>('DELETE', `/trees/${treeId}/people/${personId}`),

  // Families
  addFamily: (treeId: string, family: any) =>
    request<any>('POST', `/trees/${treeId}/families`, family),
  updateFamily: (treeId: string, familyId: string, updates: any) =>
    request<any>('PUT', `/trees/${treeId}/families/${familyId}`, updates),
  removeFamily: (treeId: string, familyId: string) =>
    request<void>('DELETE', `/trees/${treeId}/families/${familyId}`),

  // Smart actions
  addParent: (treeId: string, personId: string, gender: string) =>
    request<any>('POST', `/trees/${treeId}/actions/add-parent`, { personId, gender }),
  addSpouse: (treeId: string, personId: string) =>
    request<{ person: any; family: any }>('POST', `/trees/${treeId}/actions/add-spouse`, { personId }),
  addChild: (treeId: string, personId: string) =>
    request<any>('POST', `/trees/${treeId}/actions/add-child`, { personId }),
  addSibling: (treeId: string, personId: string) =>
    request<any>('POST', `/trees/${treeId}/actions/add-sibling`, { personId }),
  addHalfSibling: (treeId: string, personId: string, sharedParentId: string) =>
    request<any>('POST', `/trees/${treeId}/actions/add-half-sibling`, { personId, sharedParentId }),
  addCousin: (treeId: string, personId: string) =>
    request<any>('POST', `/trees/${treeId}/actions/add-cousin`, { personId }),
  link: (treeId: string, type: string, person1Id: string, person2Id: string) =>
    request<void>('POST', `/trees/${treeId}/actions/link`, { type, person1Id, person2Id }),

  // Positions
  setPosition: (treeId: string, personId: string, x: number, y: number) =>
    request<void>('POST', `/trees/${treeId}/positions`, { personId, x, y }),
  clearPosition: (treeId: string, personId: string) =>
    request<void>('DELETE', `/trees/${treeId}/positions/${personId}`),

  // GEDCOM
  importGedcom: async (file: File): Promise<any> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/import/gedcom`, { method: 'POST', body: form })
    if (!res.ok) throw new Error('Import failed')
    return res.json()
  },
  exportGedcom: (treeId: string) => {
    window.open(`${BASE}/trees/${treeId}/export/gedcom`, '_blank')
  },
}
