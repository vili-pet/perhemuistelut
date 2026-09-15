import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions.ts'
import { PlaceholderTranscriptionAdapter } from './adapter.ts'
import { buildWebhookPayload, exampleWebhookPayload, toSpeakerHints } from './payload.ts'

describe('transcription webhook payload', () => {
  it('erottelee Vilin, Leenan, Jorman ja tuntemattoman sessiotauluun', () => {
    const payload = exampleWebhookPayload()
    expect(payload.event).toBe('transcription.requested')
    expect(payload.language).toBe('fi')
    expect(payload.audio.continuousSession).toBe(true)
    expect(payload.topicTimestamps.length).toBeGreaterThan(0)
    expect(payload.facts[0]?.value).toBe('Simpele')
    expect(payload.questions).toHaveLength(QUESTIONS.length)
    expect(payload.diarization.enabled).toBe(true)
    expect(payload.diarization.interviewerId).toBe('vili')
    expect(payload.diarization.respondentIds).toEqual(['leena', 'jorma'])
    expect(payload.diarization.labelUnknownAs).toBe('unknown')
    expect(payload.diarization.knownSpeakers.map((speaker) => speaker.id)).toEqual([
      'vili',
      'leena',
      'jorma',
      'unknown',
    ])
  })

  it('rakentaa adapterin kautta saman rajapinnan ilman live-kutsua', async () => {
    const adapter = new PlaceholderTranscriptionAdapter()
    const request = {
      interviewId: 'haastattelu-1',
      language: 'fi' as const,
      audioBlobRef: 'nauha-1',
      mimeType: 'audio/webm',
      speakers: toSpeakerHints(),
      diarization: true as const,
      topicTimestamps: [
        {
          id: 'merkki-1',
          questionId: QUESTIONS[0].id,
          questionIndex: 0,
          offsetMs: 0,
          at: '2026-09-15T12:00:00.000Z',
          tapeIndex: 0,
        },
      ],
      facts: [],
      questions: QUESTIONS.map((question) => ({
        id: question.id,
        question: question.question,
        theme: question.theme,
      })),
    }
    const result = await adapter.transcribe(request)
    expect(result.status).toBe('placeholder')
    expect(result.segments).toEqual([])
    expect(result.message).toContain('haastattelun aikana')
    const payload = adapter.buildWebhookPayload(request)
    expect(payload.interviewId).toBe('haastattelu-1')
    expect(payload.topicTimestamps[0]?.questionId).toBe(QUESTIONS[0].id)
    expect(buildWebhookPayload(request).output.format).toBe('speaker-attributed-segments')
  })
})
