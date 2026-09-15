import { describe, expect, it } from 'vitest'
import { createEmptySession } from '../storage/interviewStorage.ts'
import { exportFileName, toFamilyHistoryExport } from './familyHistory.ts'

describe('family history export', () => {
  it('tuottaa jäsennellyn sukuhistoria-JSONin', () => {
    const session = createEmptySession()
    session.answers[0].notes = 'Jorma muisti koulumatkan.'
    session.answers[0].startedAt = session.createdAt
    const exported = toFamilyHistoryExport(session)
    expect(exported.schema).toBe('perhemuistelut.family-history.v1')
    expect(exported.interview.interviewer.name).toBe('Vili')
    expect(exported.interview.respondents.map((person) => person.name)).toEqual(['Leena', 'Jorma'])
    expect(exported.interview.questions).toHaveLength(10)
    expect(exported.interview.questions[0]?.notes).toBe('Jorma muisti koulumatkan.')
    expect(exported.interview.questions[0]?.transcript.placeholder).toBe(true)
    expect(exportFileName(session)).toMatch(/^perhemuistelut-\d{4}-\d{2}-\d{2}\.json$/)
  })
})
