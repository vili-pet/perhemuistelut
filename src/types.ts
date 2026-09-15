export const SPEAKER_IDS = ['vili', 'leena', 'jorma', 'unknown'] as const
export type SpeakerId = (typeof SPEAKER_IDS)[number]

export const RESPONDENT_IDS = ['leena', 'jorma'] as const
export type RespondentId = (typeof RESPONDENT_IDS)[number]

export const SPEAKER_ROLES = ['interviewer', 'respondent', 'unknown'] as const
export type SpeakerRole = (typeof SPEAKER_ROLES)[number]

export interface Person {
  id: SpeakerId
  name: string
  role: SpeakerRole
  birthYear?: number
}

export interface InterviewQuestion {
  id: string
  theme: string
  themeId: string
  question: string
  prompts: string[]
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

export interface QuestionAnswer {
  questionId: string
  question: string
  theme: string
  startedAt?: string
  endedAt?: string
  recordings: AudioRecordingMeta[]
  transcript: string
  notes: string
  segments: SpeakerSegment[]
}

export interface InterviewSession {
  schema: 'perhemuistelut.interview.v1'
  id: string
  createdAt: string
  updatedAt: string
  interviewer: Person
  respondents: Person[]
  currentQuestionIndex: number
  answers: QuestionAnswer[]
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
    questions: Array<{
      id: string
      theme: string
      question: string
      prompts: string[]
      followUps: string[]
      recordedAt: {
        startedAt?: string
        endedAt?: string
      }
      audio: AudioRecordingMeta[]
      transcript: {
        text: string
        placeholder: boolean
        segments: SpeakerSegment[]
      }
      notes: string
    }>
  }
}
