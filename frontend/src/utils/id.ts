import type { Person, Family } from '../types'

export function generatePersonId(): string {
  return `@I${Date.now()}_${Math.random().toString(36).slice(2, 6)}@`
}

export function generateFamilyId(): string {
  return `@F${Date.now()}_${Math.random().toString(36).slice(2, 6)}@`
}

export function generateTreeId(): string {
  return `tree_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createPerson(data?: Partial<{
  firstName: string
  lastName: string
  gender: 'male' | 'female' | 'other'
}>): Person {
  return {
    id: generatePersonId(),
    firstName: data?.firstName ?? '',
    lastName: data?.lastName ?? '',
    gender: data?.gender ?? 'other',
  }
}

export function createFamily(parent1Id?: string, parent2Id?: string, childrenIds: string[] = []): Family {
  return {
    id: generateFamilyId(),
    parent1Id,
    parent2Id,
    childrenIds,
  }
}
