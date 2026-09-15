import { jsonHeaders } from '../api/auth.ts'
import type { InterviewQuestion, SessionFact } from '../types.ts'
import { exampleLlmPersonalizationPayload, personalizeFromFacts } from './personalize.ts'

export function isLlmConfigured(): boolean {
  return Boolean(import.meta.env.VITE_LLM_URL || import.meta.env.VITE_PERSONALIZE_URL)
}

export async function requestLlmFollowUps(input: {
  facts: SessionFact[]
  question: InterviewQuestion
}): Promise<string[] | null> {
  const url = import.meta.env.VITE_LLM_URL || import.meta.env.VITE_PERSONALIZE_URL
  if (!url) return null

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: jsonHeaders(import.meta.env.VITE_LLM_API_KEY || import.meta.env.VITE_PERSONALIZE_API_KEY),
      body: JSON.stringify(exampleLlmPersonalizationPayload(input.facts, input.question)),
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) return null
    const payload: unknown = await response.json()
    if (!payload || typeof payload !== 'object') return null
    const followUps = (payload as { followUps?: unknown }).followUps
    if (!Array.isArray(followUps)) return null
    return followUps
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .filter((item) => item.trim() !== input.question.question.trim())
      .slice(0, 6)
  } catch {
    return null
  }
}

export async function generatePersonalizedFollowUps(input: {
  facts: SessionFact[]
  question: InterviewQuestion
}): Promise<{ followUps: string[]; source: 'llm' | 'template' }> {
  const templated = personalizeFromFacts(input.facts, input.question)
  const fromLlm = await requestLlmFollowUps(input)
  if (fromLlm && fromLlm.length > 0) {
    return { followUps: fromLlm, source: 'llm' }
  }
  return { followUps: templated, source: 'template' }
}
