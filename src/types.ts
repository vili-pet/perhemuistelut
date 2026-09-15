export const SPEAKER_IDS = ['vili', 'leena', 'jorma', 'unknown'] as const
export type SpeakerId = (typeof SPEAKER_IDS)[number]

export const RESPONDENT_IDS = ['leena', 'jorma'] as const
export type RespondentId = (typeof RESPONDENT_IDS)[number]

export const SPEAKER_ROLES = ['interviewer', 'respondent', 'unknown'] as const
export type SpeakerRole = (typeof SPEAKER_ROLES)[number]

export const THEME_IDS = [
  'lapsuus',
  'koti',
  'perheperinteet',
  'tyo',
  'rakkaus',
  'vaikeat-ajat',
  'paikat',
  'teknologia',
  'neuvo',
  'viesti',
] as const
export type ThemeId = (typeof THEME_IDS)[number]

export interface Person {
  id: SpeakerId
  name: string
  role: SpeakerRole
  birthYear?: number
}

export interface InterviewQuestion {
  id: string
  theme: string
  themeId: ThemeId
  label: string
  question: string
  followUps: string[]
}

export interface SpeakerSegment {
  id: string
  speaker: SpeakerId
  text: string
  startMs?: number
  endMs?: number
}

export interface AudioRecordingMeta {
  id: string
  mimeType: string
  durationMs?: number
  sizeBytes?: number
  createdAt: string
  blobRef: string
  source: 'media-recorder' | 'file-upload' | 'unavailable'
  fileName?: string
}

export interface TopicTimestamp {
  id: string
  questionId: string
  questionIndex: number
  offsetMs: number
  at: string
  tapeIndex: number
}

export interface QuestionMark {
  interesting: boolean
  returnLater: boolean
  note: string
  updatedAt?: string
  pokeSentAt?: string
}

export const FACT_KINDS = ['place', 'year', 'name', 'job', 'first', 'other'] as const
export type FactKind = (typeof FACT_KINDS)[number]

export interface SessionFact {
  id: string
  kind: FactKind
  key: string
  label: string
  value: string
  sourceQuestionId?: string
  createdAt: string
  edited?: boolean
}

export interface QuestionAnswer {
  questionId: string
  question: string
  theme: string
  startedAt?: string
  endedAt?: string
  cueOffsetMs?: number
  transcript: string
  notes: string
  segments: SpeakerSegment[]
  mark: QuestionMark
  personalizedFollowUps: string[]
}

export interface InterviewSession {
  schema: 'perhemuistelut.interview.v1'
  id: string
  createdAt: string
  updatedAt: string
  interviewer: Person
  respondents: Person[]
  currentQuestionIndex: number
  topicTimestamps: TopicTimestamp[]
  recordings: AudioRecordingMeta[]
  answers: QuestionAnswer[]
  facts: SessionFact[]
}

export interface FamilyHistoryExport {
  schema: 'perhemuistelut.family-history.v1'
  exportedAt: string
  interview: {
    id: string
    createdAt: string
    updatedAt: string
    interviewer: Person
    respondents: Person[]
    continuousRecording: true
    audio: AudioRecordingMeta[]
    topicTimestamps: TopicTimestamp[]
    facts: SessionFact[]
    questions: Array<{
      id: string
      theme: string
      themeId: ThemeId
      label: string
      question: string
      followUps: string[]
      personalizedFollowUps: string[]
      recordedAt: {
        startedAt?: string
        endedAt?: string
        cueOffsetMs?: number
      }
      transcript: {
        text: string
        placeholder: boolean
        segments: SpeakerSegment[]
      }
      notes: string
      mark: QuestionMark
    }>
  }
}
