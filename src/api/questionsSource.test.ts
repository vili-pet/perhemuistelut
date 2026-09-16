import { describe, expect, it } from 'vitest'
import { EXACT_PROMPTS, QUESTIONS } from '../data/questions.ts'
import {
  exampleQuestionsApiPayload,
  mergeRemoteQuestions,
  parseQuestionsPayload,
} from './questionsSource.ts'

describe('questions API parse', () => {
  it('lukee esimerkkipayloadin eikä korvaa paikallisia pääkysymyksiä', () => {
    const example = exampleQuestionsApiPayload()
    const parsed = parseQuestionsPayload(example)
    expect(parsed).toHaveLength(10)
    expect(parsed.map((item) => item.question)).toEqual([...EXACT_PROMPTS])

    const rewritten = parseQuestionsPayload({
      questions: [
        {
          id: 'eka-telkkari',
          question: 'Uudelleenkirjoitettu pääkysymys jota ei saa käyttää.',
          followUps: ['Tuliko antenni naapurista?'],
        },
      ],
    })
    const merged = mergeRemoteQuestions(rewritten)
    expect(merged).toHaveLength(QUESTIONS.length)
    expect(merged[0]?.question).toBe(EXACT_PROMPTS[0])
    expect(merged[0]?.followUps).toContain('Tuliko antenni naapurista?')
    expect(merged.map((item) => item.question)).toEqual([...EXACT_PROMPTS])
  })

  it('palauttaa tyhjän listan rikkinäisestä payloadista', () => {
    expect(parseQuestionsPayload(null)).toEqual([])
    expect(parseQuestionsPayload({ questions: 'ei' })).toEqual([])
  })
})
