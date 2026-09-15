import type { Person, SpeakerId, SpeakerSegment } from '../types.ts'

export type TranscriptionStatus = 'placeholder' | 'queued' | 'completed' | 'failed'

export interface SpeakerHint {
  id: SpeakerId
  role: Person['role']
  displayName: string
  birthYear?: number
}

export interface TranscriptionRequest {
  interviewId: string
  questionId: string
  question: string
  language: 'fi'
  audioBlob?: Blob
  audioBlobRef?: string
  mimeType?: string
  durationMs?: number
  speakers: SpeakerHint[]
  diarization: true
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
  questionId: string
  question: string
  language: 'fi'
  callbackUrl: string
  audio: {
    blobRef?: string
    mimeType?: string
    durationMs?: number
    encodingHint: string
  }
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
