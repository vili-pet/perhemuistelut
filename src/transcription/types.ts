import type { Person, SessionFact, SpeakerId, SpeakerSegment, TopicTimestamp } from '../types.ts'

export type TranscriptionStatus = 'placeholder' | 'queued' | 'completed' | 'failed'

export interface SpeakerHint {
  id: SpeakerId
  role: Person['role']
  displayName: string
  birthYear?: number
}

export interface TranscriptionQuestionCue {
  id: string
  question: string
  theme: string
  cueOffsetMs?: number
  personalizedFollowUps?: string[]
}

export interface TranscriptionRequest {
  interviewId: string
  language: 'fi'
  audioBlob?: Blob
  audioBlobRef?: string
  mimeType?: string
  durationMs?: number
  speakers: SpeakerHint[]
  diarization: true
  topicTimestamps: TopicTimestamp[]
  facts: SessionFact[]
  questions: TranscriptionQuestionCue[]
}

export interface TranscriptionResult {
  status: TranscriptionStatus
  transcript: string
  segments: SpeakerSegment[]
  provider: string
  message: string
}

export interface TranscriptionWebhookPayload {
  event: 'transcription.requested'
  version: '1'
  interviewId: string
  language: 'fi'
  callbackUrl: string
  audio: {
    blobRef?: string
    mimeType?: string
    durationMs?: number
    encodingHint: string
    continuousSession: true
  }
  topicTimestamps: TopicTimestamp[]
  facts: SessionFact[]
  questions: TranscriptionQuestionCue[]
  diarization: {
    enabled: true
    minSpeakers: number
    maxSpeakers: number
    knownSpeakers: SpeakerHint[]
    labelUnknownAs: 'unknown'
    interviewerId: 'vili'
    respondentIds: Array<'leena' | 'jorma'>
    instructions: string
  }
  output: {
    format: 'speaker-attributed-segments'
    includePlainTranscript: true
  }
}

export interface TranscriptionAdapter {
  readonly name: string
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>
  buildWebhookPayload(request: TranscriptionRequest, callbackUrl?: string): TranscriptionWebhookPayload
}
