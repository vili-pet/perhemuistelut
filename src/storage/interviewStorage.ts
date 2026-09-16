import { INTERVIEWER, RESPONDENTS } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import { extractFactsFromAnswer, mergeFacts } from '../facts/extract.ts'
import { personalizeFromFacts } from '../facts/personalize.ts'
import { createId, nowIso } from '../lib/id.ts'
import type {
  InterviewSession,
  QuestionAnswer,
  QuestionMark,
  SessionFact,
  TopicTimestamp,
} from '../types.ts'

export const STORAGE_KEY = 'perhemuistelut.interview.v1'

export const EMPTY_TRANSCRIPT_PLACEHOLDER =
  '(Litterointi odottaa ulkoista puheentunnistusputkea. Voit kirjoittaa tarinan itse.)'

export interface TopicMarker {
  offsetMs: number
  tapeIndex: number
}

export function emptyMark(): QuestionMark {
  return {
    interesting: false,
    returnLater: false,
    note: '',
  }
}

export function createEmptyAnswer(question: (typeof QUESTIONS)[number]): QuestionAnswer {
  return {
    questionId: question.id,
    question: question.question,
    theme: question.theme,
    transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
    notes: '',
    segments: [],
    mark: emptyMark(),
    personalizedFollowUps: [],
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
    topicTimestamps: [],
    recordings: [],
    answers: QUESTIONS.map(createEmptyAnswer),
    facts: [],
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
    session.respondents.length === 2 &&
    Array.isArray(session.topicTimestamps) &&
    Array.isArray(session.recordings)
  )
}

export function createTopicTimestamp(
  index: number,
  marker: TopicMarker,
): TopicTimestamp {
  const question = QUESTIONS[index]
  return {
    id: createId('merkki'),
    questionId: question.id,
    questionIndex: index,
    offsetMs: Math.max(0, Math.round(marker.offsetMs)),
    at: nowIso(),
    tapeIndex: marker.tapeIndex,
  }
}

export function withQuestionIndex(
  session: InterviewSession,
  index: number,
  marker?: TopicMarker,
): InterviewSession {
  const nextIndex = Math.min(Math.max(index, 0), QUESTIONS.length - 1)
  const sameQuestion = nextIndex === session.currentQuestionIndex
  const timestamps = marker
    ? appendTopicTimestamp(session, nextIndex, marker, sameQuestion)
    : session.topicTimestamps

  const answers = marker
    ? stampAnswerWindow(session.answers, session.currentQuestionIndex, nextIndex, marker)
    : session.answers

  if (sameQuestion && timestamps === session.topicTimestamps) {
    return session
  }

  const nextSession: InterviewSession = {
    ...session,
    currentQuestionIndex: nextIndex,
    topicTimestamps: timestamps,
    answers,
    updatedAt: nowIso(),
  }

  if (sameQuestion) return nextSession
  return snapshotTopicAndPersonalize(nextSession, session.currentQuestionIndex, nextIndex)
}

function appendTopicTimestamp(
  session: InterviewSession,
  index: number,
  marker: TopicMarker,
  sameQuestion: boolean,
): TopicTimestamp[] {
  const last = session.topicTimestamps.at(-1)
  if (
    last &&
    last.questionId === QUESTIONS[index].id &&
    last.tapeIndex === marker.tapeIndex &&
    (sameQuestion || last.offsetMs === Math.max(0, Math.round(marker.offsetMs)))
  ) {
    return session.topicTimestamps
  }

  return [...session.topicTimestamps, createTopicTimestamp(index, marker)]
}

function stampAnswerWindow(
  answers: QuestionAnswer[],
  fromIndex: number,
  toIndex: number,
  marker: TopicMarker,
): QuestionAnswer[] {
  const stamp = nowIso()
  return answers.map((answer, index) => {
    if (index === fromIndex && fromIndex !== toIndex) {
      return { ...answer, endedAt: stamp }
    }
    if (index === toIndex) {
      return {
        ...answer,
        startedAt: answer.startedAt ?? stamp,
        cueOffsetMs: answer.cueOffsetMs ?? marker.offsetMs,
      }
    }
    return answer
  })
}

export function migrateSession(session: InterviewSession): InterviewSession {
  return {
    ...session,
    topicTimestamps: session.topicTimestamps ?? [],
    recordings: session.recordings ?? [],
    facts: session.facts ?? [],
    answers: session.answers.map((answer) => ({
      ...answer,
      segments: answer.segments ?? [],
      personalizedFollowUps: answer.personalizedFollowUps ?? [],
      mark: {
        interesting: Boolean(answer.mark?.interesting),
        returnLater: Boolean(answer.mark?.returnLater),
        note: answer.mark?.note ?? '',
        updatedAt: answer.mark?.updatedAt,
        pokeSentAt: answer.mark?.pokeSentAt,
      },
    })),
  }
}

export function loadSession(): InterviewSession | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isInterviewSession(parsed)) return null
    return migrateSession(parsed)
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

export function snapshotTopicAndPersonalize(
  session: InterviewSession,
  fromIndex: number,
  toIndex: number,
): InterviewSession {
  const source = session.answers[fromIndex]
  const extracted = source ? extractFactsFromAnswer(source) : []
  const facts = mergeFacts(session.facts ?? [], extracted)
  const dest = QUESTIONS[toIndex]
  const personalized = dest ? personalizeFromFacts(facts, dest) : []

  return {
    ...session,
    facts,
    answers: session.answers.map((answer, index) =>
      index === toIndex ? { ...answer, personalizedFollowUps: personalized } : answer,
    ),
    updatedAt: nowIso(),
  }
}

export function withPersonalizedFollowUps(
  session: InterviewSession,
  questionIndex: number,
  followUps: string[],
): InterviewSession {
  return {
    ...session,
    answers: session.answers.map((answer, index) =>
      index === questionIndex ? { ...answer, personalizedFollowUps: followUps } : answer,
    ),
    updatedAt: nowIso(),
  }
}

export function updateFactValue(
  session: InterviewSession,
  factId: string,
  value: string,
): InterviewSession {
  return {
    ...session,
    facts: session.facts.map((fact) =>
      fact.id === factId ? { ...fact, value: value.trim(), edited: true } : fact,
    ),
    updatedAt: nowIso(),
  }
}

export function removeFact(session: InterviewSession, factId: string): InterviewSession {
  return {
    ...session,
    facts: session.facts.filter((fact) => fact.id !== factId),
    updatedAt: nowIso(),
  }
}

export function addManualFact(
  session: InterviewSession,
  input: Pick<SessionFact, 'kind' | 'key' | 'label' | 'value'>,
): InterviewSession {
  const fact: SessionFact = {
    id: createId('fakta'),
    kind: input.kind,
    key: input.key,
    label: input.label,
    value: input.value.trim(),
    createdAt: nowIso(),
    edited: true,
  }
  if (!fact.value) return session
  return {
    ...session,
    facts: mergeFacts(session.facts, [fact]),
    updatedAt: nowIso(),
  }
}

export function patchAnswerMark(
  session: InterviewSession,
  index: number,
  patch: Partial<QuestionMark>,
): InterviewSession {
  return {
    ...session,
    updatedAt: nowIso(),
    answers: session.answers.map((answer, answerIndex) =>
      answerIndex === index
        ? {
            ...answer,
            mark: {
              ...answer.mark,
              ...patch,
              updatedAt: nowIso(),
            },
          }
        : answer,
    ),
  }
}

export function listBlobRefs(session: InterviewSession): string[] {
  return session.recordings.map((recording) => recording.blobRef)
}

export function answerHasContent(answer: QuestionAnswer): boolean {
  const notes = answer.notes.trim().length > 0
  const markNote = answer.mark.note.trim().length > 0
  const flagged = answer.mark.interesting || answer.mark.returnLater
  const transcript =
    answer.transcript.trim().length > 0 && answer.transcript !== EMPTY_TRANSCRIPT_PLACEHOLDER
  const segments = answer.segments.some((segment) => segment.text.trim().length > 0)
  return notes || markNote || flagged || transcript || segments
}

export function isFlaggedAnswer(answer: QuestionAnswer): boolean {
  return answer.mark.interesting || answer.mark.returnLater || answer.mark.note.trim().length > 0
}

export function countSavedStories(session: InterviewSession | null): number {
  if (!session) return 0
  return session.answers.filter(answerHasContent).length
}
