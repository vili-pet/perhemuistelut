import { describe, expect, it } from 'vitest'
import { getRespondent } from '../data/participants.ts'
import { createEmptySession } from '../storage/interviewStorage.ts'
import {
  exportFileName,
  storiesFileName,
  toFamilyHistoryExport,
  toStoriesText,
} from './familyHistory.ts'

describe('family history export', () => {
  it('tuottaa jäsennellyn sukuhistoria-JSONin yhdelle haastateltavalle', () => {
    const session = createEmptySession(getRespondent('jorma'))
    session.answers[0].notes = 'Jorma muisti koulumatkan.'
    session.answers[0].startedAt = session.createdAt
    const exported = toFamilyHistoryExport(session)
    expect(exported.schema).toBe('perhemuistelut.family-history.v1')
    expect(exported.interview.interviewer.name).toBe('Vili')
    expect(exported.interview.respondents.map((person) => person.name)).toEqual(['Jorma'])
    expect(exported.interview.questions).toHaveLength(10)
    expect(exported.interview.questions[0]?.notes).toBe('Jorma muisti koulumatkan.')
    expect(exported.interview.questions[0]?.transcript.placeholder).toBe(true)
    expect(exportFileName(session)).toMatch(/^perhemuistelut-jorma-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('muodostaa luettavan tekstitiedoston vain täytetyistä aiheista', () => {
    const session = createEmptySession(getRespondent('leena'))
    session.answers[0].notes = 'Keinu pihalla.'
    const text = toStoriesText(session)
    expect(text).toContain('Haastateltava: Leena (s. 1957)')
    expect(text).toContain('Lapsuus')
    expect(text).toContain('Keinu pihalla.')
    expect(text).not.toContain('2. Koti')
    expect(storiesFileName(session)).toMatch(/^perhemuistelut-leena-\d{4}-\d{2}-\d{2}\.txt$/)
  })
})
