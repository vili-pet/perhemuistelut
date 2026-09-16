import { describe, expect, it } from 'vitest'
import { EXACT_PROMPTS, getQuestionById, QUESTIONS, REQUIRED_THEMES } from './questions.ts'

describe('QUESTIONS', () => {
  it('sisältää tasan kymmenen kehotetta kysymykset.md:stä', () => {
    expect(QUESTIONS).toHaveLength(10)
    expect(QUESTIONS.map((question) => question.question)).toEqual([...EXACT_PROMPTS])
  })

  it('kattaa kaikki kymmenen teemaa', () => {
    expect(new Set(QUESTIONS.map((question) => question.themeId))).toEqual(new Set(REQUIRED_THEMES))
  })

  it('jokaisella aiheella on vähintään kolme jatkoa', () => {
    for (const question of QUESTIONS) {
      expect(question.question.length).toBeGreaterThan(20)
      expect(question.followUps.length).toBeGreaterThanOrEqual(3)
      expect(question.label.length).toBeGreaterThan(0)
    }
  })

  it('löytää kysymyksen tunnisteella', () => {
    expect(getQuestionById('eka-telkkari')?.themeId).toBe('teknologia')
    expect(getQuestionById('puuttuu')).toBeUndefined()
  })
})
