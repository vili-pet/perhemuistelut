import { INTERVIEWER, RESPONDENTS } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import { createId, nowIso } from '../lib/id.ts'
import type { InterviewSession, QuestionAnswer } from '../types.ts'

export const STORAGE_KEY = 'perhemuistelut.interview.v1'

export const EMPTY_TRANSCRIPT_PLACEHOLDER =
  '(Litterointi odottaa ulkoista puheentunnistusputkea. Voit kirjoittaa muistiinpanot ja puhujajaksot itse.)'

export function createEmptyAnswer(question: (typeof QUESTIONS)[number]): QuestionAnswer {
  return {
    questionId: question.id,
    question: question.question,
    theme: question.theme,
    recordings: [],
    transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
    notes: '',
    segments: [],
  }
}

export function createEmptySession(): InterviewSession {
  const timestamp = nowIso()
  return {
    schema: 'perhemuistelut.interview.v1',
    id: createId('haastattelu'),
    createdAt: timestamp,
    updatedAt: timestamp,
    interviewer: INTERVIEWER,
    respondents: RESPONDENTS,
    currentQuestionIndex: 0,
    answers: QUESTIONS.map(createEmptyAnswer),
  }
}

export function isInterviewSession(value: unknown): value is InterviewSession {
  if (!value || typeof value !== 'object') return false
  const session = value as InterviewSession
  return (
    session.schema === 'perhemuistelut.interview.v1' &&
    typeof session.id === 'string' &&
    Array.isArray(session.answers) &&
    session.answers.length === QUESTIONS.length &&
    typeof session.currentQuestionIndex === 'number'
  )
}

export function loadSession(): InterviewSession | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isInterviewSession(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function loadOrCreateSession(): InterviewSession {
  return loadSession() ?? createEmptySession()
}

export function saveSession(session: InterviewSession): void {
  if (typeof localStorage === 'undefined') return
  const next: InterviewSession = {
    ...session,
    updatedAt: nowIso(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearSession(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function listBlobRefs(session: InterviewSession): string[] {
  return session.answers.flatMap((answer) => answer.recordings.map((recording) => recording.blobRef))
}
