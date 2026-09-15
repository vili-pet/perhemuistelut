import { ALL_SPEAKERS } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import type { TranscriptionRequest, TranscriptionWebhookPayload } from './types.ts'

export const EXAMPLE_CALLBACK_URL = 'https://example.invalid/webhooks/perhemuistelut/transcription'

export const DIARIZATION_INSTRUCTIONS =
  'Erottele puhujat. Haastattelija on Vili. Vastaajat ovat Leena ja Jorma (s. 1957); he juttelevat yhdessä. ' +
  'Jos puhujaa ei voida tunnistaa, merkitse speaker-kenttään unknown. Palauta aikaleimatut segmentit. ' +
  'Käytä topicTimestamps-kenttää aiheiden rajoihin samassa nauhassa. Älä odota live-webhookia haastattelun aikana.'

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
    language: 'fi',
    callbackUrl,
    audio: {
      blobRef: request.audioBlobRef,
      mimeType: request.mimeType,
      durationMs: request.durationMs,
      encodingHint: request.mimeType ?? 'audio/webm',
      continuousSession: true,
    },
    topicTimestamps: request.topicTimestamps,
    questions: request.questions,
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
    language: 'fi',
    audioBlobRef: 'nauhoitus-esimerkki',
    mimeType: 'audio/webm;codecs=opus',
    durationMs: 184000,
    speakers: toSpeakerHints(),
    diarization: true,
    topicTimestamps: [
      {
        id: 'merkki-1',
        questionId: QUESTIONS[0].id,
        questionIndex: 0,
        offsetMs: 0,
        at: '2026-09-15T12:00:00.000Z',
        tapeIndex: 0,
      },
      {
        id: 'merkki-2',
        questionId: QUESTIONS[1].id,
        questionIndex: 1,
        offsetMs: 421000,
        at: '2026-09-15T12:07:01.000Z',
        tapeIndex: 0,
      },
    ],
    questions: QUESTIONS.map((question, index) => ({
      id: question.id,
      question: question.question,
      theme: question.theme,
      cueOffsetMs: index === 1 ? 421000 : index === 0 ? 0 : undefined,
    })),
  })
}
