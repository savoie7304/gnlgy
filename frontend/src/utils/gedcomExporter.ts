import type { FamilyTree } from '../types'

function escapeGedcomValue(value: string): string {
  return value.replace(/\n/g, '\n1 CONT ')
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

export function exportToGedcom(tree: FamilyTree): string {
  const lines: string[] = []

  lines.push('0 HEAD')
  lines.push('1 GEDC')
  lines.push('2 VERS 5.5')
  lines.push('2 FORM LINEAGE-LINKED')
  lines.push('1 CHAR UTF-8')
  lines.push('1 SOUR GENEALOGIE_APP')
  lines.push('2 NAME Genealogie Web App')
  lines.push(`1 DATE ${formatDate(new Date().toISOString())}`)
  lines.push(`1 FILE ${tree.name.replace(/\s+/g, '_')}.ged`)

  const personToFamilyMap: Record<string, string[]> = {}
  const personToChildFamilyMap: Record<string, string[]> = {}

  for (const family of Object.values(tree.families)) {
    if (family.parent1Id) {
      personToFamilyMap[family.parent1Id] = personToFamilyMap[family.parent1Id] || []
      personToFamilyMap[family.parent1Id].push(family.id)
    }
    if (family.parent2Id) {
      personToFamilyMap[family.parent2Id] = personToFamilyMap[family.parent2Id] || []
      personToFamilyMap[family.parent2Id].push(family.id)
    }
    for (const childId of family.childrenIds) {
      personToChildFamilyMap[childId] = personToChildFamilyMap[childId] || []
      personToChildFamilyMap[childId].push(family.id)
    }
  }

  for (const person of Object.values(tree.people)) {
    const nameStr = `${person.firstName} /${person.lastName || '?'}/`
    lines.push(`0 ${person.id} INDI`)
    lines.push(`1 NAME ${escapeGedcomValue(nameStr)}`)
    if (person.gender === 'male') lines.push('1 SEX M')
    else if (person.gender === 'female') lines.push('1 SEX F')
    else if (person.gender) lines.push('1 SEX U')

    if (person.birthDate || person.birthPlace) {
      lines.push('1 BIRT')
      if (person.birthDate) lines.push(`2 DATE ${formatDate(person.birthDate)}`)
      if (person.birthPlace) lines.push(`2 PLAC ${escapeGedcomValue(person.birthPlace)}`)
    }

    if (person.deathDate || person.deathPlace) {
      lines.push('1 DEAT')
      if (person.deathDate) lines.push(`2 DATE ${formatDate(person.deathDate)}`)
      if (person.deathPlace) lines.push(`2 PLAC ${escapeGedcomValue(person.deathPlace)}`)
    }

    const famsIds = personToFamilyMap[person.id]
    if (famsIds) {
      for (const famId of famsIds) {
        lines.push(`1 FAMS ${famId}`)
      }
    }

    const famcIds = personToChildFamilyMap[person.id]
    if (famcIds) {
      for (const famId of famcIds) {
        lines.push(`1 FAMC ${famId}`)
      }
    }
  }

  for (const family of Object.values(tree.families)) {
    lines.push(`0 ${family.id} FAM`)
    if (family.parent1Id) lines.push(`1 HUSB ${family.parent1Id}`)
    if (family.parent2Id) lines.push(`1 WIFE ${family.parent2Id}`)
    for (const childId of family.childrenIds) {
      lines.push(`1 CHIL ${childId}`)
    }
    if (family.marriageDate) {
      lines.push('1 MARR')
      lines.push(`2 DATE ${formatDate(family.marriageDate)}`)
    }
    if (family.divorceDate) {
      lines.push('1 DIV')
      lines.push(`2 DATE ${formatDate(family.divorceDate)}`)
    }
  }

  lines.push('0 TRLR')

  return lines.join('\n')
}

export function downloadGedcom(tree: FamilyTree): void {
  const content = exportToGedcom(tree)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tree.name.replace(/\s+/g, '_')}.ged`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
