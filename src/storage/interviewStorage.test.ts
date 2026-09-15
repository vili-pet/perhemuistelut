import { afterEach, describe, expect, it } from 'vitest'
import { INTERVIEWER, RESPONDENTS } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import {
  answerHasContent,
  clearSession,
  countSavedStories,
  createEmptySession,
  isInterviewSession,
  listBlobRefs,
  loadOrCreateSession,
  saveSession,
  STORAGE_KEY,
  withQuestionIndex,
} from './interviewStorage.ts'

afterEach(() => {
  localStorage.clear()
})

describe('interviewStorage', () => {
  it('luo yhteisen istunnon Vilille, Leenalle ja Jormalle', () => {
    const session = createEmptySession()
    expect(session.schema).toBe('perhemuistelut.interview.v1')
    expect(session.interviewer).toEqual(INTERVIEWER)
    expect(session.respondents).toEqual(RESPONDENTS)
    expect(session.respondents.map((person) => person.name)).toEqual(['Leena', 'Jorma'])
    expect(session.answers).toHaveLength(QUESTIONS.length)
    expect(session.recordings).toEqual([])
    expect(session.topicTimestamps).toEqual([])
    expect(session.answers[0]?.transcript).toContain('Litterointi')
  })

  it('tallentaa yhden istunnon avaimeen', () => {
    const session = createEmptySession()
    session.answers[0].notes = 'Yhteinen muisto telkkarista.'
    saveSession(session)

    expect(localStorage.getItem(STORAGE_KEY)).toContain('telkkarista')
    expect(loadOrCreateSession().answers[0]?.notes).toBe('Yhteinen muisto telkkarista.')
    expect(loadOrCreateSession().respondents).toHaveLength(2)
  })

  it('hylkää rikkinäisen tallenteen', () => {
    expect(isInterviewSession({ schema: 'väärä' })).toBe(false)
    localStorage.setItem(STORAGE_KEY, '{"broken":true}')
    const created = loadOrCreateSession()
    expect(created.schema).toBe('perhemuistelut.interview.v1')
    expect(created.respondents.map((person) => person.id)).toEqual(['leena', 'jorma'])
  })

  it('listaa session nauhaviitteet ja tyhjentää istunnon', () => {
    const session = createEmptySession()
    session.recordings.push({
      id: 'nauha-1',
      blobRef: 'nauha-1',
      mimeType: 'audio/webm',
      createdAt: session.createdAt,
      source: 'media-recorder',
    })
    session.answers[0].notes = 'Jäi talteen.'
    saveSession(session)

    expect(listBlobRefs(session)).toEqual(['nauha-1'])
    clearSession()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(loadOrCreateSession().answers[0]?.notes).toBe('')
  })

  it('laskee tallennetut aiheet', () => {
    const session = createEmptySession()
    expect(countSavedStories(session)).toBe(0)
    expect(answerHasContent(session.answers[0])).toBe(false)
    session.answers[0].notes = 'Kesä mökillä.'
    expect(answerHasContent(session.answers[0])).toBe(true)
    expect(countSavedStories(session)).toBe(1)
  })

  it('withQuestionIndex merkitsee aiheen eikä pudota nauhoja', () => {
    const session = createEmptySession()
    session.recordings.push({
      id: 'nauha-1',
      blobRef: 'nauha-1',
      mimeType: 'audio/webm',
      createdAt: session.createdAt,
      source: 'media-recorder',
    })
    session.answers[0].notes = 'Telkkari oli nurkassa.'

    const next = withQuestionIndex(session, 1, { offsetMs: 12345, tapeIndex: 0 })
    expect(next.recordings).toHaveLength(1)
    expect(next.recordings[0]?.id).toBe('nauha-1')
    expect(next.answers[0]?.notes).toBe('Telkkari oli nurkassa.')
    expect(next.currentQuestionIndex).toBe(1)
    expect(next.topicTimestamps).toHaveLength(1)
    expect(next.topicTimestamps[0]?.questionId).toBe(QUESTIONS[1].id)
    expect(next.topicTimestamps[0]?.offsetMs).toBe(12345)
    expect(next.topicTimestamps[0]?.tapeIndex).toBe(0)
    expect(next.answers[1]?.cueOffsetMs).toBe(12345)

    const back = withQuestionIndex(next, 0, { offsetMs: 18000, tapeIndex: 0 })
    expect(back.recordings).toEqual(next.recordings)
    expect(back.topicTimestamps).toHaveLength(2)
    expect(back.currentQuestionIndex).toBe(0)
  })

  it('withQuestionIndex ilman merkkiä vaihtaa aiheen eikä koske nauhoihin', () => {
    const session = createEmptySession()
    session.recordings.push({
      id: 'nauha-2',
      blobRef: 'nauha-2',
      mimeType: 'audio/webm',
      createdAt: session.createdAt,
      source: 'file-upload',
    })
    const next = withQuestionIndex(session, 3)
    expect(next.currentQuestionIndex).toBe(3)
    expect(next.recordings).toHaveLength(1)
    expect(next.topicTimestamps).toEqual([])
  })
})
