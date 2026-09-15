import { afterEach, describe, expect, it } from 'vitest'
import { INTERVIEWER, RESPONDENTS } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import {
  clearSession,
  createEmptySession,
  isInterviewSession,
  listBlobRefs,
  loadOrCreateSession,
  saveSession,
  STORAGE_KEY,
} from './interviewStorage.ts'

afterEach(() => {
  localStorage.clear()
})

describe('interviewStorage', () => {
  it('luo istunnon Vilille, Leenalle ja Jormalle', () => {
    const session = createEmptySession()
    expect(session.schema).toBe('perhemuistelut.interview.v1')
    expect(session.interviewer).toEqual(INTERVIEWER)
    expect(session.respondents).toEqual(RESPONDENTS)
    expect(session.answers).toHaveLength(QUESTIONS.length)
    expect(session.answers[0]?.transcript).toContain('Litterointi')
  })

  it('tallentaa ja palauttaa istunnon localStoragesta', () => {
    const session = createEmptySession()
    session.answers[0].notes = 'Leena muisti pihakeinun.'
    saveSession(session)
    expect(localStorage.getItem(STORAGE_KEY)).toContain('pihakeinun')

    const loaded = loadOrCreateSession()
    expect(loaded.id).toBe(session.id)
    expect(loaded.answers[0]?.notes).toBe('Leena muisti pihakeinun.')
  })

  it('hylkää rikkinäisen tallenteen', () => {
    expect(isInterviewSession({ schema: 'väärä' })).toBe(false)
    localStorage.setItem(STORAGE_KEY, '{"broken":true}')
    const created = loadOrCreateSession()
    expect(created.schema).toBe('perhemuistelut.interview.v1')
  })

  it('listaa ääniviitteet ja tyhjentää istunnon', () => {
    const session = createEmptySession()
    session.answers[0].recordings.push({
      id: 'nauha-1',
      blobRef: 'nauha-1',
      mimeType: 'audio/webm',
      createdAt: session.createdAt,
      source: 'media-recorder',
    })
    expect(listBlobRefs(session)).toEqual(['nauha-1'])
    saveSession(session)
    clearSession()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
