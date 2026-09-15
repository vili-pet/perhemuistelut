import { getRespondent, INTERVIEWER, isRespondentId } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import { createId, nowIso } from '../lib/id.ts'
import type { InterviewSession, Person, QuestionAnswer, RespondentId } from '../types.ts'

export const STORAGE_KEY = 'perhemuistelut.interview.v1'
export const ACTIVE_RESPONDENT_KEY = 'perhemuistelut.active-respondent.v1'

export const EMPTY_TRANSCRIPT_PLACEHOLDER =
  '(Litterointi odottaa ulkoista puheentunnistusputkea. Voit kirjoittaa tarinan itse.)'

export function sessionStorageKey(personId: RespondentId): string {
  return `${STORAGE_KEY}.${personId}`
}

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

export function createEmptySession(respondent: Person): InterviewSession {
  const timestamp = nowIso()
  return {
    schema: 'perhemuistelut.interview.v1',
    id: createId('haastattelu'),
    createdAt: timestamp,
    updatedAt: timestamp,
    interviewer: INTERVIEWER,
    respondents: [respondent],
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
    typeof session.currentQuestionIndex === 'number' &&
    Array.isArray(session.respondents) &&
    session.respondents.length > 0
  )
}

export function loadActiveRespondent(): RespondentId | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(ACTIVE_RESPONDENT_KEY)
    return isRespondentId(raw) ? raw : null
  } catch {
    return null
  }
}

export function saveActiveRespondent(personId: RespondentId | null): void {
  if (typeof localStorage === 'undefined') return
  if (personId) {
    localStorage.setItem(ACTIVE_RESPONDENT_KEY, personId)
    return
  }
  localStorage.removeItem(ACTIVE_RESPONDENT_KEY)
}

export function loadSession(personId: RespondentId): InterviewSession | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(sessionStorageKey(personId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isInterviewSession(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function loadOrCreateSession(personId: RespondentId): InterviewSession {
  return loadSession(personId) ?? createEmptySession(getRespondent(personId))
}

export function saveSession(session: InterviewSession): void {
  if (typeof localStorage === 'undefined') return
  const personId = session.respondents[0]?.id
  if (!isRespondentId(personId)) return
  const next: InterviewSession = {
    ...session,
    updatedAt: nowIso(),
  }
  localStorage.setItem(sessionStorageKey(personId), JSON.stringify(next))
}

export function clearSession(personId: RespondentId): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(sessionStorageKey(personId))
}

export function listBlobRefs(session: InterviewSession): string[] {
  return session.answers.flatMap((answer) => answer.recordings.map((recording) => recording.blobRef))
}

export function answerHasContent(answer: QuestionAnswer): boolean {
  const notes = answer.notes.trim().length > 0
  const transcript =
    answer.transcript.trim().length > 0 && answer.transcript !== EMPTY_TRANSCRIPT_PLACEHOLDER
  const recordings = answer.recordings.length > 0
  const segments = answer.segments.some((segment) => segment.text.trim().length > 0)
  return notes || transcript || recordings || segments
}

export function countSavedStories(session: InterviewSession | null): number {
  if (!session) return 0
  return session.answers.filter(answerHasContent).length
}
