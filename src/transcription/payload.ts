import { ALL_SPEAKERS } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import type { TranscriptionRequest, TranscriptionWebhookPayload } from './types.ts'

export const EXAMPLE_CALLBACK_URL = 'https://example.invalid/webhooks/perhemuistelut/hedy'

export const DIARIZATION_INSTRUCTIONS =
  'Erottele puhujat luonnoksena. Haastattelija on Vili. Vastaajat ovat Leena ja Jorma (s. 1957); he juttelevat yhdessä. ' +
  'Jos puhujaa ei voida tunnistaa, merkitse speaker-kenttään unknown. Palauta aikaleimatut segmentit. ' +
  'Käytä topicTimestamps-kenttää aiheiden rajoihin samassa nauhassa. ' +
  'diarizationDraft on true: diarisointi ei ole lopullinen. humanReviewRequired: Vili tarkistaa puhujatägit. ' +
  'Hedy on jälkikäsittely. Älä nauhoita Hedyssä haastattelun aikana äläkä odota live-kutsua.'

export function toSpeakerHints() {
  return ALL_SPEAKERS.map((person) => ({
    id: person.id,
    role: person.role,
    displayName: person.name,
    birthYear: person.birthYear,
  }))
}

export function hedyEndpoint(): string | undefined {
  const hedy =
    (import.meta.env.VITE_HEDY_WEBHOOK_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_HEDY_API_URL as string | undefined)?.trim()
  if (hedy) return hedy
  return (import.meta.env.VITE_TRANSCRIPTION_WEBHOOK_URL as string | undefined)?.trim() || undefined
}

export function hedyCallbackUrl(): string | undefined {
  return (
    (import.meta.env.VITE_HEDY_CALLBACK_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_TRANSCRIPTION_CALLBACK_URL as string | undefined)?.trim() ||
    undefined
  )
}

export function buildWebhookPayload(
  request: TranscriptionRequest,
  callbackUrl = EXAMPLE_CALLBACK_URL,
): TranscriptionWebhookPayload {
  const speakers = request.speakers
  return {
    event: 'transcription.requested',
    version: '1',
    provider: 'hedy',
    mode: 'post-process',
    liveCapture: false,
    diarizationDraft: true,
    humanReviewRequired: true,
    interviewId: request.interviewId,
    language: 'fi',
    callbackUrl,
    audio: {
      blobRef: request.audioBlobRef,
      fileRef: request.audioBlobRef,
      mimeType: request.mimeType,
      durationMs: request.durationMs,
      encodingHint: request.mimeType ?? 'audio/webm',
      continuousSession: true,
    },
    topicTimestamps: request.topicTimestamps,
    speakers,
    facts: request.facts,
    questions: request.questions,
    diarization: {
      enabled: true,
      diarizationDraft: true,
      humanReviewRequired: true,
      minSpeakers: 2,
      maxSpeakers: 4,
      knownSpeakers: speakers,
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
    facts: [
      {
        id: 'fakta-1',
        kind: 'place',
        key: 'syntymäpaikka',
        label: 'Syntymäpaikka',
        value: 'Simpele',
        sourceQuestionId: QUESTIONS[2].id,
        createdAt: '2026-09-15T12:08:00.000Z',
      },
    ],
    questions: QUESTIONS.map((question, index) => ({
      id: question.id,
      question: question.question,
      theme: question.theme,
      cueOffsetMs: index === 1 ? 421000 : index === 0 ? 0 : undefined,
      personalizedFollowUps:
        index === 2 ? ['Minä vuonna muutitte pois Simpeleeltä?'] : [],
    })),
  })
}
