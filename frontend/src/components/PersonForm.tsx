import { useState, useEffect } from 'react'
import type { Person } from '../types'

interface Props {
  open: boolean
  person: Person | null
  onSave: (data: Partial<Person>) => void
  onDelete?: () => void
  onClose: () => void
}

export default function PersonForm({ open, person, onSave, onDelete, onClose }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other')
  const [birthDate, setBirthDate] = useState('')
  const [deathDate, setDeathDate] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [deathPlace, setDeathPlace] = useState('')
  const [occupation, setOccupation] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState('')

  useEffect(() => {
    setFirstName(person?.firstName ?? '')
    setLastName(person?.lastName ?? '')
    setGender(person?.gender ?? 'other')
    setBirthDate(person?.birthDate ?? '')
    setDeathDate(person?.deathDate ?? '')
    setBirthPlace(person?.birthPlace ?? '')
    setDeathPlace(person?.deathPlace ?? '')
    setOccupation(person?.occupation ?? '')
    setNotes(person?.notes ?? '')
    setPhoto(person?.photo ?? '')
  }, [person, open])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    onSave({ firstName, lastName, gender, birthDate: birthDate || undefined, deathDate: deathDate || undefined, birthPlace: birthPlace || undefined, deathPlace: deathPlace || undefined, occupation: occupation || undefined, notes: notes || undefined, photo: photo || undefined })
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h2>{person?.id ? 'Modifier la personne' : 'Nouvelle personne'}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-row">
            <div className="input-group">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" />
            </div>
            <div className="input-group">
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Sexe :</span>
            {(['male', 'female', 'other'] as const).map((g) => (
              <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} />
                {g === 'male' ? 'Homme' : g === 'female' ? 'Femme' : 'Autre'}
              </label>
            ))}
          </div>

          <div className="input-row">
            <div className="input-group">
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="Date naissance" />
            </div>
            <div className="input-group">
              <input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} placeholder="Date décès" />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Lieu naissance" />
            </div>
            <div className="input-group">
              <input value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)} placeholder="Lieu décès" />
            </div>
          </div>

          <div className="input-group">
            <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Profession" />
          </div>

          <div>
            <label style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Photo</label>
            {photo && <img src={photo} alt="Photo" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: 14 }} />
              {photo && <button className="btn btn-sm btn-danger" onClick={() => setPhoto('')}>Supprimer</button>}
            </div>
          </div>

          <div className="input-group">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={3} />
          </div>
        </div>

        <div className="modal-actions">
          {onDelete && <button className="btn btn-sm btn-danger" onClick={onDelete}>Supprimer</button>}
          {!onDelete && <div />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={onClose}>Annuler</button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
