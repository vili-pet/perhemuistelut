import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions.ts'
import { extractFactsFromText, mergeFacts } from './extract.ts'
import { personalizeFromFacts } from './personalize.ts'

describe('fact extraction', () => {
  it('poimii paikan ja vuoden tekstistä', () => {
    const facts = extractFactsFromText('Synnyin Simpeleellä vuonna 1957.', 'eka-telkkari')
    expect(facts.some((fact) => fact.kind === 'place' && fact.value === 'Simpele')).toBe(true)
    expect(facts.some((fact) => fact.kind === 'year' && fact.value === '1957')).toBe(true)
  })

  it('ei korvaa muokattua faktaa samalla avaimella', () => {
    const existing = extractFactsFromText('Asuimme Helsingissä.', 'eka-auto')
    const edited = existing.map((fact) =>
      fact.key === 'asuinpaikka' ? { ...fact, value: 'Kotka', edited: true } : fact,
    )
    const merged = mergeFacts(edited, extractFactsFromText('Asuimme Helsingissä.', 'eka-auto'))
    expect(merged.some((fact) => fact.value === 'Kotka' && fact.edited)).toBe(true)
  })
})

describe('personalizeFromFacts', () => {
  it('luo tukikysymyksiä eikä kirjoita pääkysymystä uusiksi', () => {
    const question = QUESTIONS[0]
    const followUps = personalizeFromFacts(
      [
        {
          id: 'fakta-1',
          kind: 'place',
          key: 'syntymäpaikka',
          label: 'Syntymäpaikka',
          value: 'Simpele',
          createdAt: '2026-09-15T12:00:00.000Z',
        },
      ],
      question,
    )
    expect(followUps.length).toBeGreaterThan(0)
    expect(followUps).not.toContain(question.question)
    expect(followUps.some((item) => item.includes('Simpele'))).toBe(true)
  })

  it('kysyy lapsuudessa milloin Simpeleeltä muutettiin', () => {
    const lapsuus = QUESTIONS.find((question) => question.themeId === 'lapsuus')
    expect(lapsuus).toBeDefined()
    const followUps = personalizeFromFacts(
      [
        {
          id: 'fakta-1',
          kind: 'place',
          key: 'syntymäpaikka',
          label: 'Syntymäpaikka',
          value: 'Simpele',
          createdAt: '2026-09-15T12:00:00.000Z',
        },
      ],
      lapsuus!,
    )
    expect(followUps).toContain('Minä vuonna muutitte pois Simpeleeltä?')
    expect(followUps).not.toContain(lapsuus!.question)
  })
})
