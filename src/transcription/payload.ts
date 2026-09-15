import { ALL_SPEAKERS } from '../data/participants.ts'
import type { TranscriptionRequest, TranscriptionWebhookPayload } from './types.ts'

export const EXAMPLE_CALLBACK_URL = 'https://example.invalid/webhooks/perhemuistelut/transcription'

export const DIARIZATION_INSTRUCTIONS =
  'Erottele puhujat. Haastattelija on Vili. Vastaajat ovat Leena ja Jorma (s. 1957). ' +
  'Jos puhujaa ei voida tunnistaa, merkitse speaker-kenttään unknown. Palauta aikaleimatut segmentit.'

export function toSpeakerHints() {
  return ALL_SPEAKERS.map((person) => ({
    id: person.id,
    role: person.role,
    displayName: person.name,
    birthYear: person.birthYear,
  }))
}

export function buildWebhookPayload(
  request: TranscriptionRequest,
  callbackUrl = EXAMPLE_CALLBACK_URL,
): TranscriptionWebhookPayload {
  return {
    event: 'transcription.requested',
    version: '1',
    interviewId: request.interviewId,
    questionId: request.questionId,
    question: request.question,
    language: 'fi',
    callbackUrl,
    audio: {
      blobRef: request.audioBlobRef,
      mimeType: request.mimeType,
      durationMs: request.durationMs,
      encodingHint: request.mimeType ?? 'audio/webm',
    },
    diarization: {
      enabled: true,
      minSpeakers: 2,
      maxSpeakers: 4,
      knownSpeakers: request.speakers,
      labelUnknownAs: 'unknown',
      interviewerId: 'vili',
      respondentIds: ['leena', 'jorma'],
      instructions: DIARIZATION_INSTRUCTIONS,
    },
    output: {
      format: 'speaker-attributed-segments',
      includePlainTranscript: true,
    },
  }
}

export function exampleWebhookPayload(): TranscriptionWebhookPayload {
  return buildWebhookPayload({
    interviewId: 'haastattelu-esimerkki',
    questionId: 'lapsuus',
    question: 'Miltä lapsuutenne näytti?',
    language: 'fi',
    audioBlobRef: 'nauhoitus-esimerkki',
    mimeType: 'audio/webm;codecs=opus',
    durationMs: 184000,
    speakers: toSpeakerHints(),
    diarization: true,
  })
}
