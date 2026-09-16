import { describe, expect, it } from 'vitest'
import {
  buildPokeBookmarkPayload,
  isPokeConfigured,
  sendPokeBookmark,
} from './poke.ts'
import { QUESTIONS } from '../data/questions.ts'
import { createEmptySession } from '../storage/interviewStorage.ts'

describe('Poke outbound', () => {
  it('rakentaa paluu-muistutuksen Vilin merkinnästä', () => {
    const session = createEmptySession()
    session.answers[0].mark.note = 'Palaa autoon.'
    session.answers[0].cueOffsetMs = 125000
    const payload = buildPokeBookmarkPayload({
      session,
      question: QUESTIONS[0],
      answer: session.answers[0],
    })
    expect(payload.source).toBe('perhemuistelut')
    expect(payload.returnLater).toBe(true)
    expect(payload.questionId).toBe(QUESTIONS[0].id)
    expect(payload.message).toContain('Palaa autoon.')
    expect(payload.offsetLabel).toBe('2:05')
  })

  it('jättää merkin paikalliseksi ilman avainta', async () => {
    expect(isPokeConfigured()).toBe(false)
    const result = await sendPokeBookmark({
      message: 'x',
      source: 'perhemuistelut',
      interviewId: 'haastattelu-1',
      questionId: QUESTIONS[0].id,
      question: QUESTIONS[0].question,
      theme: QUESTIONS[0].theme,
      note: 'x',
      returnLater: true,
    })
    expect(result.ok).toBe(false)
    expect(result.message).toContain('Poke-avainta ei ole')
  })
})
