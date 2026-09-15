import { afterEach, describe, expect, it } from 'vitest'
import { getRespondent, INTERVIEWER } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import {
  ACTIVE_RESPONDENT_KEY,
  answerHasContent,
  clearSession,
  countSavedStories,
  createEmptySession,
  isInterviewSession,
  listBlobRefs,
  loadActiveRespondent,
  loadOrCreateSession,
  saveActiveRespondent,
  saveSession,
  sessionStorageKey,
  STORAGE_KEY,
} from './interviewStorage.ts'

const leena = getRespondent('leena')
const jorma = getRespondent('jorma')

afterEach(() => {
  localStorage.clear()
})

describe('interviewStorage', () => {
  it('luo Leenan istunnon Vilin haastattelemana', () => {
    const session = createEmptySession(leena)
    expect(session.schema).toBe('perhemuistelut.interview.v1')
    expect(session.interviewer).toEqual(INTERVIEWER)
    expect(session.respondents).toEqual([leena])
    expect(session.answers).toHaveLength(QUESTIONS.length)
    expect(session.answers[0]?.transcript).toContain('Litterointi')
  })

  it('tallentaa Leenan ja Jorman tarinat erilleen', () => {
    const leenaSession = createEmptySession(leena)
    leenaSession.answers[0].notes = 'Leena muisti pihakeinun.'
    saveSession(leenaSession)

    const jormaSession = createEmptySession(jorma)
    jormaSession.answers[0].notes = 'Jorma muisti koulumatkan.'
    saveSession(jormaSession)

    expect(localStorage.getItem(sessionStorageKey('leena'))).toContain('pihakeinun')
    expect(localStorage.getItem(sessionStorageKey('jorma'))).toContain('koulumatkan')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    expect(loadOrCreateSession('leena').answers[0]?.notes).toBe('Leena muisti pihakeinun.')
    expect(loadOrCreateSession('jorma').answers[0]?.notes).toBe('Jorma muisti koulumatkan.')
  })

  it('hylkää rikkinäisen tallenteen', () => {
    expect(isInterviewSession({ schema: 'väärä' })).toBe(false)
    localStorage.setItem(sessionStorageKey('leena'), '{"broken":true}')
    const created = loadOrCreateSession('leena')
    expect(created.schema).toBe('perhemuistelut.interview.v1')
    expect(created.respondents[0]?.id).toBe('leena')
  })

  it('listaa ääniviitteet ja tyhjentää vain valitun istunnon', () => {
    const session = createEmptySession(leena)
    session.answers[0].recordings.push({
      id: 'nauha-1',
      blobRef: 'nauha-1',
      mimeType: 'audio/webm',
      createdAt: session.createdAt,
      source: 'media-recorder',
    })
    const other = createEmptySession(jorma)
    other.answers[0].notes = 'Jäi talteen.'
    saveSession(session)
    saveSession(other)

    expect(listBlobRefs(session)).toEqual(['nauha-1'])
    clearSession('leena')
    expect(localStorage.getItem(sessionStorageKey('leena'))).toBeNull()
    expect(loadOrCreateSession('jorma').answers[0]?.notes).toBe('Jäi talteen.')
  })

  it('laskee tallennetut aiheet ja muistaa valitun haastateltavan', () => {
    const session = createEmptySession(leena)
    expect(countSavedStories(session)).toBe(0)
    expect(answerHasContent(session.answers[0])).toBe(false)
    session.answers[0].notes = 'Kesä mökillä.'
    expect(answerHasContent(session.answers[0])).toBe(true)
    expect(countSavedStories(session)).toBe(1)

    expect(loadActiveRespondent()).toBeNull()
    saveActiveRespondent('jorma')
    expect(loadActiveRespondent()).toBe('jorma')
    expect(localStorage.getItem(ACTIVE_RESPONDENT_KEY)).toBe('jorma')
    saveActiveRespondent(null)
    expect(loadActiveRespondent()).toBeNull()
  })
})
