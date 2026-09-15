import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions.ts'
import { createEmptySession } from '../storage/interviewStorage.ts'
import { buildPokeBookmarkPayload, POKE_INBOUND_URL } from './poke.ts'

describe('Poke reminder payload', () => {
  it('rakentaa outbound-muistutuksen paluu-merkinnästä, ei kysymys-APIa', () => {
    const session = createEmptySession()
    const question = QUESTIONS[1]
    session.answers[1].mark.returnLater = true
    session.answers[1].mark.note = 'Jorma muistaa merkin.'
    session.answers[1].cueOffsetMs = 125000

    const payload = buildPokeBookmarkPayload({
      session,
      question,
      answer: session.answers[1],
    })

    expect(POKE_INBOUND_URL).toBe('https://poke.com/api/v1/inbound/api-message')
    expect(payload.source).toBe('perhemuistelut')
    expect(payload.returnLater).toBe(true)
    expect(payload.questionId).toBe(question.id)
    expect(payload.question).toBe(question.question)
    expect(payload.note).toBe('Jorma muistaa merkin.')
    expect(payload.offsetLabel).toBe('2:05')
    expect(payload.message).toContain('palaa myöhemmin')
    expect(payload.message).toContain('Leena ja Jorma')
    expect(payload).not.toHaveProperty('questions')
    expect(payload).not.toHaveProperty('followUps')
  })
})
