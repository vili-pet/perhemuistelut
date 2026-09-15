import { describe, expect, it } from 'vitest'
import { EXACT_PROMPTS, QUESTIONS } from '../data/questions.ts'
import { TOPICS } from '../../bot/topics.mjs'

describe('bot topics', () => {
  it('on täsmälleen samat 10 kehotetta kuin Mini Appissa', () => {
    expect(TOPICS).toHaveLength(10)
    expect(TOPICS.map((topic: { question: string }) => topic.question)).toEqual([...EXACT_PROMPTS])
    expect(TOPICS.map((topic: { id: string }) => topic.id)).toEqual(QUESTIONS.map((item) => item.id))
  })
})
