import { formatDuration } from '../lib/format.ts'
import type { InterviewQuestion, InterviewSession, QuestionAnswer } from '../types.ts'
import { jsonHeaders } from './auth.ts'

export const POKE_INBOUND_URL = 'https://poke.com/api/v1/inbound/api-message'

export interface PokeInboundPayload {
  message: string
  source: 'perhemuistelut'
  interviewId: string
  questionId: string
  question: string
  theme: string
  note: string
  offsetLabel?: string
  returnLater: boolean
}

export function isPokeConfigured(): boolean {
  return Boolean(import.meta.env.VITE_POKE_API_KEY)
}

export function buildPokeBookmarkPayload(input: {
  session: InterviewSession
  question: InterviewQuestion
  answer: QuestionAnswer
}): PokeInboundPayload {
  const offset =
    input.answer.cueOffsetMs != null ? formatDuration(input.answer.cueOffsetMs) : undefined
  const note = input.answer.mark.note.trim() || 'Ei erillistä merkintää.'
  const message = [
    'Perhemuistelut: palaa myöhemmin tähän aiheeseen.',
    `Aihe: ${input.question.label} — ${input.question.question}`,
    `Haastateltavat: Leena ja Jorma (s. 1957). Haastattelija: Vili.`,
    offset ? `Nauhan kohta: ${offset}` : undefined,
    `Merkintä: ${note}`,
  ]
    .filter(Boolean)
    .join('\n')

  return {
    message,
    source: 'perhemuistelut',
    interviewId: input.session.id,
    questionId: input.question.id,
    question: input.question.question,
    theme: input.question.theme,
    note,
    offsetLabel: offset,
    returnLater: true,
  }
}

export async function sendPokeBookmark(payload: PokeInboundPayload): Promise<{
  ok: boolean
  message: string
}> {
  const apiKey = import.meta.env.VITE_POKE_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      message: 'Poke-avainta ei ole. Merkintä jää tälle laitteelle. Aseta VITE_POKE_API_KEY, jos haluat muistutuksen Pokeen.',
    }
  }

  try {
    const response = await fetch(POKE_INBOUND_URL, {
      method: 'POST',
      headers: jsonHeaders(apiKey),
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      return {
        ok: false,
        message: `Poke vastasi ${response.status}. Merkintä on silti tallessa tässä sovelluksessa.`,
      }
    }
    return {
      ok: true,
      message: 'Muistutus lähetettiin Pokeen. Voit palata aiheeseen myöhemmin sieltä tai tästä listasta.',
    }
  } catch {
    return {
      ok: false,
      message: 'Pokeen ei saatu yhteyttä. Merkintä jäi paikallisesti.',
    }
  }
}
