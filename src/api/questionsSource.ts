import { QUESTIONS, getQuestionById } from '../data/questions.ts'
import type { InterviewQuestion, ThemeId } from '../types.ts'
import { bearerHeaders } from './auth.ts'

export const EXAMPLE_QUESTIONS_API_URL = 'https://example.invalid/api/perhemuistelut/questions'

export interface QuestionsApiPayload {
  source: 'perhemuistelut.questions.v1'
  language: 'fi'
  interviewer: 'Vili'
  respondents: Array<'leena' | 'jorma'>
  questions: Array<{
    id: string
    theme: string
    themeId: ThemeId
    label: string
    question: string
    followUps: string[]
  }>
}

export function exampleQuestionsApiPayload(): QuestionsApiPayload {
  return {
    source: 'perhemuistelut.questions.v1',
    language: 'fi',
    interviewer: 'Vili',
    respondents: ['leena', 'jorma'],
    questions: QUESTIONS.map((question) => ({
      id: question.id,
      theme: question.theme,
      themeId: question.themeId,
      label: question.label,
      question: question.question,
      followUps: question.followUps,
    })),
  }
}

function isThemeId(value: unknown): value is ThemeId {
  return (
    value === 'lapsuus' ||
    value === 'koti' ||
    value === 'perheperinteet' ||
    value === 'tyo' ||
    value === 'rakkaus' ||
    value === 'vaikeat-ajat' ||
    value === 'paikat' ||
    value === 'teknologia' ||
    value === 'neuvo' ||
    value === 'viesti'
  )
}

export function parseQuestionsPayload(value: unknown): InterviewQuestion[] {
  if (!value || typeof value !== 'object') return []
  const payload = value as { questions?: unknown }
  if (!Array.isArray(payload.questions)) return []

  const parsed: InterviewQuestion[] = []
  for (const item of payload.questions) {
    if (!item || typeof item !== 'object') continue
    const row = item as Partial<InterviewQuestion>
    if (typeof row.id !== 'string' || typeof row.question !== 'string') continue
    const local = getQuestionById(row.id)
    parsed.push({
      id: row.id,
      theme: typeof row.theme === 'string' ? row.theme : (local?.theme ?? 'Aihe'),
      themeId: isThemeId(row.themeId) ? row.themeId : (local?.themeId ?? 'lapsuus'),
      label: typeof row.label === 'string' ? row.label : (local?.label ?? row.id),
      question: row.question,
      followUps: Array.isArray(row.followUps)
        ? row.followUps.filter((entry) => typeof entry === 'string')
        : (local?.followUps ?? []),
    })
  }
  return parsed
}

export function mergeRemoteQuestions(remote: InterviewQuestion[]): InterviewQuestion[] {
  if (remote.length === 0) return QUESTIONS
  return QUESTIONS.map((local) => {
    const match = remote.find((item) => item.id === local.id)
    if (!match) return local
    const extra = match.followUps.filter((item) => !local.followUps.includes(item))
    return {
      ...local,
      followUps: extra.length > 0 ? [...local.followUps, ...extra] : local.followUps,
    }
  })
}

export async function fetchQuestionsFromApi(): Promise<{
  questions: InterviewQuestion[]
  source: 'local' | 'api'
  message: string
}> {
  const endpoint = import.meta.env.VITE_QUESTIONS_API_URL
  if (!endpoint) {
    return {
      questions: QUESTIONS,
      source: 'local',
      message: 'Kysymykset ovat paikallisesta setistä. Ulkoinen API ei ole kytketty.',
    }
  }

  try {
    const response = await fetch(endpoint, {
      headers: bearerHeaders(import.meta.env.VITE_QUESTIONS_API_KEY),
    })
    if (!response.ok) {
      return {
        questions: QUESTIONS,
        source: 'local',
        message: `Kysymys-API vastasi ${response.status}. Käytössä ovat paikalliset aiheet.`,
      }
    }
    const payload: unknown = await response.json()
    const remote = parseQuestionsPayload(payload)
    return {
      questions: mergeRemoteQuestions(remote),
      source: 'api',
      message: 'Kysymykset haettiin API:sta. Vilin 10 aiheeseen ei kosketa, vain tukikysymykset voivat täydentyä.',
    }
  } catch {
    return {
      questions: QUESTIONS,
      source: 'local',
      message: 'Kysymys-API:in ei saatu yhteyttä. Käytössä ovat paikalliset aiheet.',
    }
  }
}
