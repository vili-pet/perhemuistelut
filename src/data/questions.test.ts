import { describe, expect, it } from 'vitest'
import { getQuestionById, QUESTIONS } from './questions.ts'

const THEMES = [
  'Lapsuus',
  'Koti',
  'Perheen perinteet',
  'Työ',
  'Rakkaus ja perhe',
  'Vaikeat ajat',
  'Paikat',
  'Teknologia ja muutos',
  'Neuvo',
  'Viesti tuleville sukupolville',
]

describe('QUESTIONS', () => {
  it('sisältää kymmenen kohdennettua kysymystä', () => {
    expect(QUESTIONS).toHaveLength(10)
  })

  it('kattaa kaikki pyydetyt teemat', () => {
    expect(QUESTIONS.map((question) => question.theme)).toEqual(THEMES)
  })

  it('jokaisella kysymyksellä on tukikysymyksiä ja jatko-ohjeita', () => {
    for (const question of QUESTIONS) {
      expect(question.question.length).toBeGreaterThan(20)
      expect(question.prompts.length).toBeGreaterThanOrEqual(3)
      expect(question.followUps.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('löytää kysymyksen tunnisteella', () => {
    expect(getQuestionById('lapsuus')?.theme).toBe('Lapsuus')
    expect(getQuestionById('puuttuu')).toBeUndefined()
  })
})
