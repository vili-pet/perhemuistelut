import { describe, expect, it } from 'vitest'
import { createEmptySession } from '../storage/interviewStorage.ts'
import {
  exportFileName,
  storiesFileName,
  toFamilyHistoryExport,
  toStoriesText,
} from './familyHistory.ts'

describe('family history export', () => {
  it('tuottaa jäsennellyn sukuhistoria-JSONin molemmille vastaajille', () => {
    const session = createEmptySession()
    session.answers[0].notes = 'Leena ja Jorma muistivat telkkarin.'
    session.answers[0].startedAt = session.createdAt
    session.answers[0].cueOffsetMs = 0
    session.recordings.push({
      id: 'nauha-1',
      blobRef: 'nauha-1',
      mimeType: 'audio/webm',
      createdAt: session.createdAt,
      source: 'media-recorder',
      durationMs: 184000,
    })
    session.topicTimestamps.push({
      id: 'merkki-1',
      questionId: session.answers[0].questionId,
      questionIndex: 0,
      offsetMs: 0,
      at: session.createdAt,
      tapeIndex: 0,
    })

    const exported = toFamilyHistoryExport(session)
    expect(exported.schema).toBe('perhemuistelut.family-history.v1')
    expect(exported.interview.interviewer.name).toBe('Vili')
    expect(exported.interview.respondents.map((person) => person.name)).toEqual(['Leena', 'Jorma'])
    expect(exported.interview.continuousRecording).toBe(true)
    expect(exported.interview.audio).toHaveLength(1)
    expect(exported.interview.topicTimestamps).toHaveLength(1)
    expect(exported.interview.questions).toHaveLength(10)
    expect(exported.interview.questions[0]?.notes).toBe('Leena ja Jorma muistivat telkkarin.')
    expect(exported.interview.questions[0]?.transcript.placeholder).toBe(true)
    expect(exported.interview.questions[0]?.recordedAt.cueOffsetMs).toBe(0)
    expect(exportFileName(session)).toMatch(/^perhemuistelut-leena-jorma-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('muodostaa luettavan tekstitiedoston vain täytetyistä aiheista', () => {
    const session = createEmptySession()
    session.answers[0].notes = 'Keinu pihalla.'
    session.topicTimestamps.push({
      id: 'merkki-1',
      questionId: session.answers[0].questionId,
      questionIndex: 0,
      offsetMs: 0,
      at: session.createdAt,
      tapeIndex: 0,
    })
    const text = toStoriesText(session)
    expect(text).toContain('Haastateltavat: Leena (s. 1957) ja Jorma (s. 1957)')
    expect(text).toContain('Aihemerkit:')
    expect(text).toContain('Keinu pihalla.')
    expect(text).not.toContain('2. ')
    expect(storiesFileName(session)).toMatch(/^perhemuistelut-leena-jorma-\d{4}-\d{2}-\d{2}\.txt$/)
  })
})
