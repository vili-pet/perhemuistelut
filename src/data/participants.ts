import type { Person, RespondentId } from '../types.ts'

export const INTERVIEWER: Person = {
  id: 'vili',
  name: 'Vili',
  role: 'interviewer',
}

export const RESPONDENTS: Person[] = [
  {
    id: 'leena',
    name: 'Leena',
    role: 'respondent',
    birthYear: 1957,
  },
  {
    id: 'jorma',
    name: 'Jorma',
    role: 'respondent',
    birthYear: 1957,
  },
]

export const UNKNOWN_SPEAKER: Person = {
  id: 'unknown',
  name: 'Tuntematon',
  role: 'unknown',
}

export const ALL_SPEAKERS: Person[] = [INTERVIEWER, ...RESPONDENTS, UNKNOWN_SPEAKER]

export const SPEAKER_LABELS: Record<Person['id'], string> = {
  vili: 'Vili (haastattelija)',
  leena: 'Leena',
  jorma: 'Jorma',
  unknown: 'Tuntematon',
}

export function isRespondentId(value: string | null | undefined): value is RespondentId {
  return value === 'leena' || value === 'jorma'
}

export function getRespondent(id: RespondentId): Person {
  const person = RESPONDENTS.find((item) => item.id === id)
  if (!person) {
    throw new Error(`Tuntematon haastateltava: ${id}`)
  }
  return person
}

export function genitiveName(name: string): string {
  return `${name}n`
}
